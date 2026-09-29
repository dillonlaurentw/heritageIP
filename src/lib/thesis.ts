import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { blocksToText } from "./blocks";
import { resetCollab } from "./collab";
import { ensureSystemDb } from "./databases";
import { db } from "./db";
import { insertPage } from "./pages";
import type { Viewer } from "./session";
import { hasThesis, thesisFromBlocks, thesisToBlocks, type ThesisInput } from "./thesis-doc";
import { logActivity, requireWorkspaceRole } from "./workspaces";

/** The workspace's thesis page, if it has one. */
export async function thesisPage(workspaceId: string) {
  return db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId, systemKey: "thesis" } } });
}

/** The thesis as fields, read from the page (so edits made on the page count). */
export async function readThesis(workspaceId: string): Promise<ThesisInput | null> {
  const page = await thesisPage(workspaceId);
  if (!page || page.archivedAt) return null;
  const t = thesisFromBlocks(page.content);
  return hasThesis(t) ? t : null;
}

/** Write the thesis page (creating it the first time). The old version goes to history. */
export async function saveThesisPage(workspaceId: string, t: ThesisInput, viewer: Viewer) {
  await requireWorkspaceRole(workspaceId, viewer, "MEMBER");
  const content = thesisToBlocks(t) as unknown[];
  const existing = await thesisPage(workspaceId);
  let pageId: string;
  if (existing) {
    await db.pageVersion.create({
      data: { pageId: existing.id, title: existing.title, content: (existing.content ?? []) as Prisma.InputJsonValue, createdById: viewer.user.id },
    });
    await db.page.update({
      where: { id: existing.id },
      data: { content: content as Prisma.InputJsonValue, text: blocksToText(content), archivedAt: null, updatedById: viewer.user.id },
    });
    pageId = existing.id;
    await resetCollab(existing.id);
  } else {
    const page = await insertPage({ workspaceId, title: "Thesis", icon: "💡", content, systemKey: "thesis" }, viewer.user.id);
    pageId = page.id;
  }
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  await db.workspace.update({
    where: { id: workspaceId },
    data: { stage: ws.stage === "IDEA" ? "THESIS" : ws.stage, oneLiner: ws.oneLiner ?? t.statement.slice(0, 140) },
  });
  await logActivity(workspaceId, viewer.user.id, "thesis.saved", pageId, { title: "Thesis" });
  return pageId;
}

export type PlanStepInput = { stage: "VALIDATE" | "SETUP" | "BUILD" | "LAUNCH"; title: string; detail: string; needs: string[] };

/**
 * Put agent-proposed steps into the Game plan database. Steps the agent added
 * earlier and nobody finished are replaced; done steps and steps people wrote
 * themselves stay.
 */
export async function applyPlan(workspaceId: string, steps: PlanStepInput[], viewer: Viewer) {
  await requireWorkspaceRole(workspaceId, viewer, "MEMBER");
  const plan = await ensureSystemDb(workspaceId, "gamePlan", viewer.user.id);
  const old = await db.page.findMany({ where: { parentId: plan.id, kind: "ROW", archivedAt: null, template: "ai-step" }, select: { id: true, props: true } });
  const stale = old.filter((r) => (r.props as Record<string, unknown> | null)?.status !== "done").map((r) => r.id);
  if (stale.length) await db.page.updateMany({ where: { id: { in: stale } }, data: { archivedAt: new Date(), archivedById: viewer.user.id } });
  for (const s of steps) {
    await insertPage(
      {
        workspaceId,
        parentId: plan.id,
        kind: "ROW",
        title: s.title,
        template: "ai-step",
        props: { stage: s.stage, status: "todo", needs: s.needs },
        content: s.detail ? [{ type: "paragraph", props: {}, content: [{ type: "text", text: s.detail, styles: {} }], children: [] }] : [],
      },
      viewer.user.id,
    );
  }
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  if (ws.stage === "IDEA" || ws.stage === "THESIS") await db.workspace.update({ where: { id: workspaceId }, data: { stage: "PLAN" } });
  await logActivity(workspaceId, viewer.user.id, "plan.generated", plan.id, { title: "Game plan", count: steps.length });
  return plan;
}

/** Titles of finished game-plan steps, so a new plan doesn't repeat them. */
export async function doneSteps(workspaceId: string) {
  const plan = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId, systemKey: "gamePlan" } } });
  if (!plan) return [];
  const rows = await db.page.findMany({ where: { parentId: plan.id, kind: "ROW", archivedAt: null }, select: { title: true, props: true } });
  return rows.filter((r) => (r.props as Record<string, unknown> | null)?.status === "done").map((r) => r.title);
}
