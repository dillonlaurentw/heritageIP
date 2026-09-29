"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { agentChatAgent, pageAssistAgent, routerAgent, runAgent, workspaceBriefing } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { blocksToText } from "@/lib/blocks";
import { db } from "@/lib/db";
import { NEED_TAGS } from "@/lib/needs";
import { requireEditablePage } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { addPlanStep, addTasks } from "@/lib/tasks";
import { LEGAL_DISCLAIMER, PAGE_ACTION_KEYS, WORKSPACE_AGENTS, routeByKeywords } from "@/lib/workspace-agents";
import { requireWorkspaceRole } from "@/lib/workspaces";

const id = z.string().min(1).max(64);
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}\n[…cut for length]` : s);

// ── Ask AI on a page ──────────────────────────────────────────

const askInput = z.object({
  action: z.enum(PAGE_ACTION_KEYS),
  instruction: z.string().max(1000).default(""),
  selection: z.string().max(20_000).default(""),
  /** The page as the editor has it now (it may be ahead of the last save). */
  pageText: z.string().max(60_000).default(""),
});

/** Propose text or tasks for a page. Saves nothing. */
export async function askPage(pageId: string, input: z.input<typeof askInput>) {
  const viewer = await requireOnboarded();
  const page = await requireEditablePage(id.parse(pageId), viewer);
  const i = askInput.parse(input);
  const briefing = await workspaceBriefing(page.workspaceId);
  return runAgent(
    pageAssistAgent,
    {
      action: i.action,
      instruction: i.instruction.trim(),
      pageTitle: page.title,
      pageText: clip(i.pageText || blocksToText(page.content), 12_000),
      selection: clip(i.selection, 8_000),
      briefing: clip(briefing, 4_000),
    },
    { userId: viewer.user.id, workspaceId: page.workspaceId },
  );
}

const taskList = z
  .array(z.object({ title: z.string().trim().min(1).max(200), detail: z.string().max(1000).default("") }))
  .min(1, "Pick at least one task.")
  .max(20);

/** "Add N tasks": the accepted tasks go into the Tasks database, linked to the page. */
export async function addTasksFromPage(pageId: string, tasks: unknown) {
  const viewer = await requireOnboarded();
  const page = await requireEditablePage(id.parse(pageId), viewer);
  const parsed = taskList.safeParse(tasks);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const res = await addTasks(page.workspaceId, parsed.data, viewer, { pageId: page.id, title: page.title });
  revalidatePath("/", "layout");
  return { ok: true as const, count: res.ids.length, href: res.href };
}

// ── Workspace agents ──────────────────────────────────────────

const agentKey = z.enum(WORKSPACE_AGENTS);

async function agentThread(userId: string, workspaceId: string, agent: string) {
  const kind = `agent:${agent}`;
  return (
    (await db.agentThread.findFirst({ where: { userId, workspaceId, kind }, orderBy: { createdAt: "desc" } })) ??
    (await db.agentThread.create({ data: { userId, workspaceId, kind } }))
  );
}

/** Send a message to a workspace agent; returns the stored exchange. */
export async function sendAgentMessage(workspaceId: string, agent: string, message: string) {
  const viewer = await requireOnboarded();
  const wsId = id.parse(workspaceId);
  const key = agentKey.parse(agent);
  const role = await requireWorkspaceRole(wsId, viewer, "MEMBER");
  const text = z.string().trim().min(1, "Say something first.").max(4000).safeParse(message);
  if (!text.success) return { ok: false as const, message: text.error.issues[0].message };

  const thread = await agentThread(viewer.user.id, wsId, key);
  const history = await db.agentMessage.findMany({ where: { threadId: thread.id }, orderBy: { createdAt: "asc" }, select: { role: true, text: true } });
  const res = await runAgent(
    agentChatAgent,
    {
      agent: key,
      briefing: await workspaceBriefing(wsId),
      askerName: viewer.user.name,
      askerRole: role.toLowerCase(),
      history: history.filter((m): m is { role: "USER" | "AGENT"; text: string } => m.role === "USER" || m.role === "AGENT"),
      message: text.data,
    },
    { userId: viewer.user.id, workspaceId: wsId },
  );
  if (!res.ok) return res;

  const out = { ...res.output };
  // The legal explainer always says it isn't legal advice, whatever the model did.
  if (key === "legal" && !out.reply.includes("isn't legal advice") && !out.reply.includes("not legal advice")) {
    out.reply = `${out.reply.trimEnd()}\n\n${LEGAL_DISCLAIMER}`;
  }
  const user = await db.agentMessage.create({ data: { threadId: thread.id, role: "USER", text: text.data } });
  const reply = await db.agentMessage.create({
    data: { threadId: thread.id, role: "AGENT", text: out.reply, data: { type: "reply", ...out } as Prisma.InputJsonValue },
  });
  await db.agentThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
  return {
    ok: true as const,
    demo: res.demo,
    user: { id: user.id, role: "USER" as const, text: user.text, data: null },
    reply: { id: reply.id, role: "AGENT" as const, text: out.reply, data: out },
  };
}

/** Start a fresh conversation with an agent (the old one stays in the database). */
export async function newAgentConversation(workspaceId: string, agent: string) {
  const viewer = await requireOnboarded();
  const wsId = id.parse(workspaceId);
  await requireWorkspaceRole(wsId, viewer, "MEMBER");
  await db.agentThread.create({ data: { userId: viewer.user.id, workspaceId: wsId, kind: `agent:${agentKey.parse(agent)}` } });
  revalidatePath("/", "layout");
}

/** "Add to Tasks" on an agent's suggestion. */
export async function addAgentTasks(workspaceId: string, tasks: unknown) {
  const viewer = await requireOnboarded();
  const parsed = taskList.safeParse(tasks);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const res = await addTasks(id.parse(workspaceId), parsed.data, viewer);
  revalidatePath("/", "layout");
  return { ok: true as const, count: res.ids.length, href: res.href };
}

const stepInput = z.object({
  title: z.string().trim().min(1).max(200),
  detail: z.string().max(1000),
  stage: z.enum(["VALIDATE", "SETUP", "BUILD", "LAUNCH"]),
  needs: z.array(z.enum(NEED_TAGS)).max(10),
});

/** "Add to game plan" on an agent's suggested step. */
export async function addAgentStep(workspaceId: string, step: unknown) {
  const viewer = await requireOnboarded();
  const parsed = stepInput.safeParse(step);
  if (!parsed.success) return { ok: false as const, message: "That step doesn't look right." };
  const res = await addPlanStep(id.parse(workspaceId), parsed.data, viewer);
  revalidatePath("/", "layout");
  return { ok: true as const, href: res.href };
}

/** "Ask SELF anything": pick the agent for a question. Falls back to keywords. */
export async function routeQuestion(workspaceId: string, question: string) {
  const viewer = await requireOnboarded();
  const wsId = id.parse(workspaceId);
  await requireWorkspaceRole(wsId, viewer, "MEMBER");
  const q = z.string().trim().min(1).max(2000).parse(question);
  const res = await runAgent(routerAgent, { question: q }, { userId: viewer.user.id, workspaceId: wsId });
  return res.ok ? res.output.agent : routeByKeywords(q);
}
