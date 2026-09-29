import "server-only";
import { db } from "@/lib/db";
import { NEEDS, type Need } from "@/lib/needs";
import { STAGES } from "@/lib/system-dbs";
import { readThesis } from "@/lib/thesis";
import { thesisBlock } from "./context";

type Props = Record<string, unknown>;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/**
 * Everything a workspace agent knows about the company, as plain text:
 * thesis, game plan, open tasks, goals, team and recent pages. What the
 * model sees is exactly this; keep it readable and bounded.
 */
export async function workspaceBriefing(workspaceId: string) {
  const ws = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: {
      name: true,
      oneLiner: true,
      rawIdea: true,
      stage: true,
      members: { select: { role: true, title: true, user: { select: { id: true, name: true } } } },
    },
  });
  const names = new Map(ws.members.map((m) => [m.user.id, m.user.name]));
  const systems = await db.page.findMany({
    where: { workspaceId, systemKey: { in: ["gamePlan", "tasks", "goals"] }, archivedAt: null },
    select: { id: true, systemKey: true },
  });
  const rowsOf = async (key: string, take: number) => {
    const s = systems.find((x) => x.systemKey === key);
    if (!s) return [];
    return db.page.findMany({
      where: { parentId: s.id, kind: "ROW", archivedAt: null },
      orderBy: { position: "asc" },
      take,
      select: { title: true, props: true },
    });
  };
  const [thesis, plan, tasks, goals, pages] = await Promise.all([
    readThesis(workspaceId),
    rowsOf("gamePlan", 40),
    rowsOf("tasks", 60),
    rowsOf("goals", 12),
    db.page.findMany({
      where: { workspaceId, kind: "PAGE", archivedAt: null, systemKey: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { title: true, text: true },
    }),
  ]);

  const out: string[] = [`COMPANY: ${ws.name}${ws.oneLiner ? ` (${ws.oneLiner})` : ""}`, `Stage: ${ws.stage.toLowerCase()}`];
  if (ws.rawIdea) out.push(`Original idea: ${clip(ws.rawIdea, 400)}`);
  out.push("", thesis ? `THESIS\n${thesisBlock(thesis)}` : "THESIS: not written yet.");

  if (plan.length) {
    out.push("", "GAME PLAN");
    for (const s of STAGES) {
      const steps = plan.filter((r) => (r.props as Props | null)?.stage === s.id);
      if (!steps.length) continue;
      out.push(`${s.name}:`);
      for (const r of steps) {
        const p = (r.props ?? {}) as Props;
        const needs = Array.isArray(p.needs) ? (p.needs as Need[]).filter((n) => n in NEEDS).map((n) => NEEDS[n].label) : [];
        out.push(`- [${p.status === "done" ? "x" : " "}] ${r.title}${needs.length ? ` (needs: ${needs.join(", ")})` : ""}`);
      }
    }
  } else out.push("", "GAME PLAN: none yet.");

  const open = tasks.filter((t) => (t.props as Props | null)?.status !== "done");
  if (tasks.length) {
    out.push("", `TASKS (${open.length} open of ${tasks.length})`);
    for (const t of open.slice(0, 25)) {
      const p = (t.props ?? {}) as Props;
      const who = Array.isArray(p.assignee) ? (p.assignee as string[]).map((id) => names.get(id)).filter(Boolean).join(", ") : "";
      out.push(`- ${t.title}${p.status === "doing" ? " [in progress]" : ""}${who ? ` · ${who}` : ""}${typeof p.due === "string" ? ` · due ${p.due}` : ""}`);
    }
  }

  if (goals.length) {
    out.push("", "GOALS");
    for (const g of goals) {
      const p = (g.props ?? {}) as Props;
      out.push(`- ${g.title}${typeof p.health === "string" ? ` (${p.health})` : ""}`);
    }
  }

  out.push("", "TEAM");
  for (const m of ws.members) out.push(`- ${m.user.name}${m.title ? `, ${m.title}` : ""} (${m.role.toLowerCase()})`);

  if (pages.length) {
    out.push("", "RECENT PAGES");
    for (const p of pages) out.push(`- ${p.title || "Untitled"}${p.text ? `: ${clip(p.text.replace(/\s+/g, " "), 280)}` : ""}`);
  }
  return out.join("\n");
}
