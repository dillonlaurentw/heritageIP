import "server-only";
import { runAgent, whatIfAgent, workspaceBriefing, type WhatIfOutput } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import type { Need } from "./needs";
import type { Viewer } from "./session";
import { addPlanStep } from "./tasks";
import { changesToApply, resolveSlips } from "./what-if-rules";
import { requireWorkspaceRole } from "./workspaces";

export type WhatIfCheck = {
  id: string;
  scenario: string;
  at: string;
  by: string;
  demo: boolean;
  summary: string;
  slips: { stepId: string; title: string; effect: string }[];
  themes: WhatIfOutput["themes"];
  money: string;
  changes: WhatIfOutput["changes"];
  applied: number[];
};

type Stored = { type: "whatif"; scenario: string; demo: boolean; output: Omit<WhatIfCheck, "id" | "scenario" | "at" | "by" | "demo" | "applied">; applied: number[] };

/** Plan steps with their state, in plan order. */
export async function planStepsFor(workspaceId: string) {
  const plan = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId, systemKey: "gamePlan" } }, select: { id: true, archivedAt: true } });
  if (!plan || plan.archivedAt) return [];
  const rows = await db.page.findMany({ where: { parentId: plan.id, kind: "ROW", archivedAt: null }, orderBy: { position: "asc" }, select: { id: true, title: true, props: true } });
  return rows.map((r) => {
    const p = (r.props ?? {}) as { status?: string; needs?: string[]; stage?: string };
    return { id: r.id, title: r.title, done: p.status === "done", needs: p.needs ?? [], stage: p.stage ?? null };
  });
}

async function thread(workspaceId: string, userId: string) {
  return (
    (await db.agentThread.findFirst({ where: { workspaceId, kind: "whatif" }, orderBy: { createdAt: "asc" } })) ??
    (await db.agentThread.create({ data: { workspaceId, userId, kind: "whatif" } }))
  );
}

/** Check a what-if against the plan. Saves the check (so the team can see it); changes nothing in the plan. */
export async function runWhatIf(viewer: Viewer, ws: { id: string }, scenario: string) {
  await requireWorkspaceRole(ws.id, viewer, "MEMBER");
  const text = scenario.trim();
  if (text.length < 8) return { ok: false as const, message: "Describe what might happen in a sentence." };
  if (text.length > 400) return { ok: false as const, message: "Keep it to a sentence or two." };
  const steps = (await planStepsFor(ws.id)).filter((s) => !s.done).map((s, i) => ({ ...s, n: i + 1 }));
  const res = await runAgent(
    whatIfAgent,
    { briefing: await workspaceBriefing(ws.id), steps: steps.map((s) => ({ n: s.n, title: s.title, stage: s.stage, needs: s.needs })), scenario: text },
    { userId: viewer.user.id, workspaceId: ws.id },
  );
  if (!res.ok) return res;
  const t = await thread(ws.id, viewer.user.id);
  const data: Stored = {
    type: "whatif",
    scenario: text,
    demo: res.demo,
    applied: [],
    output: { summary: res.output.summary, slips: resolveSlips(steps, res.output.slips), themes: res.output.themes, money: res.output.money, changes: res.output.changes },
  };
  const msg = await db.agentMessage.create({ data: { threadId: t.id, role: "AGENT", text: `What if: ${text}`, data: { ...data, by: viewer.user.id } as unknown as Prisma.InputJsonValue } });
  return { ok: true as const, id: msg.id };
}

/** The company's recent checks, newest first. */
export async function listWhatIfs(workspaceId: string): Promise<WhatIfCheck[]> {
  const msgs = await db.agentMessage.findMany({
    where: { thread: { workspaceId, kind: "whatif" } },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, createdAt: true, data: true },
  });
  const byIds = [...new Set(msgs.map((m) => (m.data as { by?: string } | null)?.by).filter((x): x is string => !!x))];
  const users = await db.user.findMany({ where: { id: { in: byIds } }, select: { id: true, name: true } });
  return msgs.flatMap((m) => {
    const d = m.data as (Stored & { by?: string }) | null;
    if (!d || d.type !== "whatif") return [];
    return [{ id: m.id, scenario: d.scenario, at: m.createdAt.toISOString(), by: users.find((u) => u.id === d.by)?.name ?? "Someone", demo: d.demo, applied: d.applied ?? [], ...d.output }];
  });
}

/** Adds the picked suggested changes to the game plan as the person's own steps. Each change only once. */
export async function applyWhatIfChanges(viewer: Viewer, ws: { id: string }, checkId: string, picked: number[]) {
  await requireWorkspaceRole(ws.id, viewer, "MEMBER");
  const msg = await db.agentMessage.findFirst({ where: { id: checkId, thread: { workspaceId: ws.id, kind: "whatif" } }, select: { id: true, data: true } });
  const d = msg?.data as (Stored & { by?: string }) | null;
  if (!msg || !d || d.type !== "whatif") return { ok: false as const, message: "That check doesn't exist." };
  const todo = changesToApply(d.output.changes.length, d.applied ?? [], picked);
  if (!todo.length) return { ok: false as const, message: "Pick at least one change that isn't in the plan yet." };
  for (const i of todo) {
    const c = d.output.changes[i]!;
    await addPlanStep(ws.id, { title: c.title, detail: c.detail, stage: c.stage, needs: c.needs as Need[] }, viewer);
  }
  await db.agentMessage.update({ where: { id: msg.id }, data: { data: { ...d, applied: [...(d.applied ?? []), ...todo] } as unknown as Prisma.InputJsonValue } });
  return { ok: true as const, added: todo.length };
}
