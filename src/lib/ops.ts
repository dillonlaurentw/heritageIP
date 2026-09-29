import "server-only";
import { db } from "./db";
import { actionItems, goalProgress, itemsToSend, startOfWeek, summarizeWeek } from "./ops-rules";
import { pageHref } from "./pages";
import type { Viewer } from "./session";
import { addTasks } from "./tasks";
import { logActivity, requireWorkspaceRole } from "./workspaces";

type Props = Record<string, unknown>;

async function systemRows(workspaceId: string, key: string) {
  const dbPage = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId, systemKey: key } }, select: { id: true, archivedAt: true } });
  if (!dbPage || dbPage.archivedAt) return { dbId: null, rows: [] };
  const rows = await db.page.findMany({
    where: { parentId: dbPage.id, kind: "ROW", archivedAt: null },
    orderBy: { position: "asc" },
    select: { id: true, title: true, props: true, updatedAt: true },
  });
  return { dbId: dbPage.id, rows: rows.map((r) => ({ ...r, props: (r.props ?? {}) as Props })) };
}

const linkedTo = (value: unknown, id: string) => Array.isArray(value) && value.includes(id);

// ── Meetings ──────────────────────────────────────────────────

/** Tasks that came from a meeting (linked through Tasks → From meeting). */
export async function meetingTasks(workspaceId: string, workspaceSlug: string, meetingId: string) {
  const { rows } = await systemRows(workspaceId, "tasks");
  return rows
    .filter((r) => linkedTo(r.props.meeting, meetingId))
    .map((r) => ({ id: r.id, title: r.title, done: r.props.status === "done", href: pageHref(workspaceSlug, r.id) }));
}

/**
 * Turn a meeting's unchecked to-dos into Tasks, linked to the meeting.
 * @mentions become assignees. Items already sent are skipped.
 */
export async function sendMeetingActions(meetingId: string, viewer: Viewer) {
  const row = await db.page.findUnique({ where: { id: meetingId }, include: { parent: { select: { systemKey: true } } } });
  if (!row || row.kind !== "ROW" || row.parent?.systemKey !== "meetings") throw new Error("Not a meeting.");
  await requireWorkspaceRole(row.workspaceId, viewer, "MEMBER");
  const [{ rows: tasks }, members] = await Promise.all([
    systemRows(row.workspaceId, "tasks"),
    db.workspaceMember.findMany({ where: { workspaceId: row.workspaceId }, select: { userId: true } }),
  ]);
  const existing = tasks.filter((t) => linkedTo(t.props.meeting, row.id)).map((t) => t.title);
  const items = actionItems(row.content);
  const toSend = itemsToSend(items, existing, members.map((m) => m.userId));
  if (!toSend.length) return { sent: 0, total: items.length, href: null };
  const res = await addTasks(
    row.workspaceId,
    toSend.map((i) => ({ title: i.title, assignee: i.assignee, meeting: row.id })),
    viewer,
    { pageId: row.id, title: row.title },
    "meeting.actions",
  );
  return { sent: toSend.length, total: items.length, href: res.href };
}

// ── Goals ─────────────────────────────────────────────────────

/** Progress for every goal in a workspace, from the tasks linked to it. */
export async function goalRollups(workspaceId: string) {
  const { rows } = await systemRows(workspaceId, "tasks");
  return goalProgress(rows.map((r) => ({ status: r.props.status, goal: r.props.goal })));
}

export async function goalTasks(workspaceId: string, workspaceSlug: string, goalId: string) {
  const { rows } = await systemRows(workspaceId, "tasks");
  return rows
    .filter((r) => linkedTo(r.props.goal, goalId))
    .map((r) => ({ id: r.id, title: r.title, done: r.props.status === "done", href: pageHref(workspaceSlug, r.id) }));
}

// ── The week ──────────────────────────────────────────────────

/** Everything the "This week" page shows. */
export async function weekData(workspaceId: string, workspaceSlug: string) {
  const since = startOfWeek();
  const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const [activity, tasks, plan, goals, meetings, rollups] = await Promise.all([
    db.activity.findMany({
      where: { workspaceId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { kind: true, createdAt: true, data: true, pageId: true, actor: { select: { name: true } }, page: { select: { title: true, archivedAt: true } } },
    }),
    systemRows(workspaceId, "tasks"),
    systemRows(workspaceId, "gamePlan"),
    systemRows(workspaceId, "goals"),
    systemRows(workspaceId, "meetings"),
    goalRollups(workspaceId),
  ]);
  const summary = summarizeWeek(
    activity
      .filter((a) => !a.page?.archivedAt)
      .map((a) => ({
        kind: a.kind,
        title: a.page?.title || (typeof (a.data as Props | null)?.title === "string" ? ((a.data as Props).title as string) : ""),
        actor: a.actor.name,
        at: a.createdAt,
        pageId: a.pageId,
      })),
  );
  const open = tasks.rows.filter((t) => t.props.status !== "done");
  const due = (t: (typeof open)[number]) => (typeof t.props.due === "string" ? t.props.due : null);
  const link = (r: { id: string; title: string }) => ({ id: r.id, title: r.title || "Untitled", href: pageHref(workspaceSlug, r.id) });
  return {
    since,
    summary,
    overdue: open.filter((t) => due(t) && due(t)! < today).map((t) => ({ ...link(t), due: due(t)! })),
    upcoming: open
      .filter((t) => due(t) && due(t)! >= today && due(t)! <= nextWeek)
      .sort((a, b) => due(a)!.localeCompare(due(b)!))
      .map((t) => ({ ...link(t), due: due(t)! })),
    plan: plan.dbId ? { done: plan.rows.filter((r) => r.props.status === "done").length, total: plan.rows.length, href: pageHref(workspaceSlug, plan.dbId) } : null,
    goals: goals.rows.map((g) => ({ ...link(g), health: typeof g.props.health === "string" ? g.props.health : null, progress: rollups[g.id] ?? null })),
    meetings: meetings.rows
      .filter((m) => typeof m.props.date === "string" && (m.props.date as string) >= since.toISOString().slice(0, 10))
      .map((m) => ({ ...link(m), date: m.props.date as string })),
  };
}

export async function logWeekSaved(workspaceId: string, viewer: Viewer, pageId: string, title: string) {
  await logActivity(workspaceId, viewer.user.id, "page.created", pageId, { title });
}
