import "server-only";
import { B } from "./blocks";
import { ensureSystemDb } from "./databases";
import { db } from "./db";
import type { Need } from "./needs";
import { insertPage, pageHref } from "./pages";
import type { Viewer } from "./session";
import { logActivity, requireWorkspaceRole } from "./workspaces";

export type TaskDraft = { title: string; detail?: string; assignee?: string[]; due?: string | null };

/** A paragraph linking back to where something came from ("From: Weekly sync"). */
function fromBlock(label: string, href: string) {
  return {
    type: "paragraph",
    props: {},
    content: [
      { type: "text", text: "From ", styles: { italic: true } },
      { type: "link", href, content: [{ type: "text", text: label || "Untitled", styles: { italic: true } }] },
    ],
    children: [],
  };
}

/**
 * Add rows to the workspace's Tasks database (created if missing). `from`
 * links each task back to the page it came from.
 */
export async function addTasks(workspaceId: string, tasks: TaskDraft[], viewer: Viewer, from?: { pageId: string; title: string }) {
  await requireWorkspaceRole(workspaceId, viewer, "MEMBER");
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { slug: true } });
  const tasksDb = await ensureSystemDb(workspaceId, "tasks", viewer.user.id);
  const ids: string[] = [];
  for (const t of tasks) {
    const content = [
      ...(t.detail ? [B.p(t.detail)] : []),
      ...(from ? [fromBlock(from.title, pageHref(ws.slug, from.pageId))] : []),
    ];
    const row = await insertPage(
      {
        workspaceId,
        parentId: tasksDb.id,
        kind: "ROW",
        title: t.title,
        props: { status: "todo", ...(t.assignee?.length ? { assignee: t.assignee } : {}), ...(t.due ? { due: t.due } : {}) },
        content,
      },
      viewer.user.id,
    );
    ids.push(row.id);
  }
  await logActivity(workspaceId, viewer.user.id, "tasks.added", from?.pageId ?? tasksDb.id, { title: from?.title ?? "Tasks", count: tasks.length });
  return { ids, href: pageHref(ws.slug, tasksDb.id) };
}

/** Add one step to the Game plan (a person accepted it, so it's theirs to keep). */
export async function addPlanStep(
  workspaceId: string,
  step: { title: string; detail: string; stage: string; needs: Need[] },
  viewer: Viewer,
) {
  await requireWorkspaceRole(workspaceId, viewer, "MEMBER");
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { slug: true } });
  const plan = await ensureSystemDb(workspaceId, "gamePlan", viewer.user.id);
  const row = await insertPage(
    {
      workspaceId,
      parentId: plan.id,
      kind: "ROW",
      title: step.title,
      props: { stage: step.stage, status: "todo", needs: step.needs },
      content: step.detail ? [B.p(step.detail)] : [],
    },
    viewer.user.id,
  );
  await logActivity(workspaceId, viewer.user.id, "plan.step_added", row.id, { title: step.title });
  return { id: row.id, href: pageHref(ws.slug, row.id) };
}
