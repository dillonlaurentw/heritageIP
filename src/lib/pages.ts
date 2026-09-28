import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import type { WorkspaceRole } from "@/generated/prisma/enums";
import { blocksToText } from "./blocks";
import { db } from "./db";
import type { Viewer } from "./session";
import { buildTree, positionBetween } from "./tree";
import { canEdit } from "./workspace-rules";
import { logActivity, requireWorkspaceRole } from "./workspaces";

export const pageHref = (workspaceSlug: string, pageId: string) => `/w/${workspaceSlug}/${pageId}`;

/** How often an edited page gets a new history snapshot. */
const VERSION_EVERY_MS = 10 * 60_000;

/** The sidebar tree for one workspace: pages and databases, not rows or trash. */
export const loadTree = cache(async (workspaceId: string, workspaceSlug: string) => {
  const rows = await db.page.findMany({
    where: { workspaceId, archivedAt: null, kind: { in: ["PAGE", "DATABASE"] } },
    select: { id: true, parentId: true, title: true, icon: true, kind: true, position: true },
  });
  return buildTree(rows, (id) => pageHref(workspaceSlug, id));
});

/**
 * Pages: load one page for someone who belongs to its workspace. Everyone
 * else, and pages in the trash, get a 404.
 */
export const getPageAccess = cache(async (workspaceSlug: string, pageId: string, viewer: Viewer) => {
  const page = await db.page.findUnique({
    where: { id: pageId },
    include: { workspace: true },
  });
  if (!page || page.workspace.slug !== workspaceSlug) notFound();
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: page.workspaceId, userId: viewer.user.id } },
    select: { role: true },
  });
  if (!member) notFound();
  return { page, role: member.role as WorkspaceRole, editable: canEdit(member.role) && !page.archivedAt };
});

/** Breadcrumb trail from the workspace root down to (not including) the page. */
export async function ancestors(pageId: string) {
  const trail: { id: string; title: string; icon: string | null; kind: string }[] = [];
  let cur = await db.page.findUnique({ where: { id: pageId }, select: { parentId: true } });
  for (let i = 0; cur?.parentId && i < 20; i++) {
    const p = await db.page.findUnique({
      where: { id: cur.parentId },
      select: { id: true, title: true, icon: true, kind: true, parentId: true },
    });
    if (!p) break;
    trail.unshift({ id: p.id, title: p.title, icon: p.icon, kind: p.kind });
    cur = p;
  }
  return trail;
}

/** Actions: load a page by id and check the viewer may edit it. */
export async function requireEditablePage(pageId: string, viewer: Viewer, min: WorkspaceRole = "MEMBER") {
  const page = await db.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page not found.");
  await requireWorkspaceRole(page.workspaceId, viewer, min);
  return page;
}

async function lastSiblingPosition(workspaceId: string, parentId: string | null) {
  const last = await db.page.findFirst({
    where: { workspaceId, parentId, archivedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return positionBetween(last?.position ?? null, null);
}

export type NewPage = {
  workspaceId: string;
  parentId?: string | null;
  title?: string;
  icon?: string | null;
  kind?: "PAGE" | "DATABASE" | "ROW";
  content?: unknown[];
  schema?: unknown;
  props?: Record<string, unknown>;
  systemKey?: string | null;
  template?: string | null;
};

/** Create a page (the caller has already checked permissions). */
export async function insertPage(input: NewPage, userId: string, tx: Prisma.TransactionClient = db) {
  const parentId = input.parentId ?? null;
  const last = await tx.page.findFirst({
    where: { workspaceId: input.workspaceId, parentId, archivedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return tx.page.create({
    data: {
      workspaceId: input.workspaceId,
      parentId,
      kind: input.kind ?? "PAGE",
      title: input.title ?? "",
      icon: input.icon ?? null,
      content: (input.content ?? []) as Prisma.InputJsonValue,
      text: blocksToText(input.content ?? []),
      schema: input.schema === undefined ? undefined : (input.schema as Prisma.InputJsonValue),
      props: input.props === undefined ? undefined : (input.props as Prisma.InputJsonValue),
      systemKey: input.systemKey ?? null,
      template: input.template ?? null,
      position: positionBetween(last?.position ?? null, null),
      createdById: userId,
      updatedById: userId,
    },
  });
}

export async function createPage(input: NewPage, viewer: Viewer) {
  await requireWorkspaceRole(input.workspaceId, viewer, "MEMBER");
  if (input.parentId) {
    const parent = await db.page.findUnique({ where: { id: input.parentId }, select: { workspaceId: true, kind: true } });
    if (!parent || parent.workspaceId !== input.workspaceId) throw new Error("Parent not found.");
  }
  const page = await insertPage(input, viewer.user.id);
  if (page.kind !== "ROW") await logActivity(page.workspaceId, viewer.user.id, "page.created", page.id, { title: page.title });
  return page;
}

export type PagePatch = {
  title?: string;
  icon?: string | null;
  coverUrl?: string | null;
  content?: unknown[];
  fullWidth?: boolean;
};

/** Save edits. Keeps a history snapshot at most every 10 minutes. */
export async function updatePage(pageId: string, patch: PagePatch, viewer: Viewer) {
  const page = await requireEditablePage(pageId, viewer);
  if (page.archivedAt) throw new Error("Restore this page to edit it.");
  const data: Prisma.PageUpdateInput = { updatedById: viewer.user.id };
  if (patch.title !== undefined) data.title = patch.title.slice(0, 200);
  if (patch.icon !== undefined) data.icon = patch.icon;
  if (patch.coverUrl !== undefined) data.coverUrl = patch.coverUrl;
  if (patch.fullWidth !== undefined) data.fullWidth = patch.fullWidth;
  if (patch.content !== undefined) {
    data.content = patch.content as Prisma.InputJsonValue;
    data.text = blocksToText(patch.content);
  }
  if (patch.content !== undefined || patch.title !== undefined) {
    const last = await db.pageVersion.findFirst({ where: { pageId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
    if (!last || Date.now() - last.createdAt.getTime() > VERSION_EVERY_MS) {
      // Snapshot what the page looked like before this burst of edits.
      await db.pageVersion.create({
        data: { pageId, title: page.title, content: (page.content ?? []) as Prisma.InputJsonValue, createdById: viewer.user.id },
      });
    }
  }
  return db.page.update({ where: { id: pageId }, data });
}

async function descendantIds(pageId: string) {
  const out: string[] = [];
  let frontier = [pageId];
  for (let depth = 0; frontier.length && depth < 30; depth++) {
    const kids = await db.page.findMany({ where: { parentId: { in: frontier } }, select: { id: true } });
    frontier = kids.map((k) => k.id);
    out.push(...frontier);
  }
  return out;
}

/** Move a page before/after a sibling, or inside another page. Same workspace only. */
export async function movePage(dragId: string, targetId: string, where: "before" | "inside" | "after", viewer: Viewer) {
  const [drag, target] = await Promise.all([
    requireEditablePage(dragId, viewer),
    db.page.findUnique({ where: { id: targetId } }),
  ]);
  if (!target || target.workspaceId !== drag.workspaceId) throw new Error("Can't move there.");
  if (drag.kind === "ROW") throw new Error("Rows live in their database.");
  if (where === "inside" && target.kind !== "PAGE") throw new Error("Pages go inside pages.");
  const newParent = where === "inside" ? target.id : target.parentId;
  if (newParent && (newParent === drag.id || (await descendantIds(drag.id)).includes(newParent))) {
    throw new Error("A page can't go inside itself.");
  }
  let position: number;
  if (where === "inside") {
    position = await lastSiblingPosition(drag.workspaceId, target.id);
  } else {
    const siblings = await db.page.findMany({
      where: { workspaceId: drag.workspaceId, parentId: target.parentId, archivedAt: null, id: { not: drag.id } },
      orderBy: { position: "asc" },
      select: { id: true, position: true },
    });
    const i = siblings.findIndex((s) => s.id === target.id);
    const before = where === "before" ? siblings[i - 1] : siblings[i];
    const after = where === "before" ? siblings[i] : siblings[i + 1];
    position = positionBetween(before?.position ?? null, after?.position ?? null);
  }
  return db.page.update({ where: { id: drag.id }, data: { parentId: newParent, position } });
}

/** Move to the trash, with everything inside it. Restoring brings them all back. */
export async function archivePage(pageId: string, viewer: Viewer) {
  const page = await requireEditablePage(pageId, viewer);
  if (page.systemKey === "home") throw new Error("The workspace home can't be deleted.");
  const now = new Date();
  const ids = [page.id, ...(await descendantIds(page.id))];
  await db.page.updateMany({ where: { id: { in: ids }, archivedAt: null }, data: { archivedAt: now, archivedById: viewer.user.id } });
  await logActivity(page.workspaceId, viewer.user.id, "page.archived", page.id, { title: page.title });
  return page;
}

export async function restorePage(pageId: string, viewer: Viewer) {
  const page = await requireEditablePage(pageId, viewer);
  if (!page.archivedAt) return page;
  const ids = [page.id, ...(await descendantIds(page.id))];
  // Bring back what went to the trash together with it.
  await db.page.updateMany({ where: { id: { in: ids }, archivedAt: page.archivedAt }, data: { archivedAt: null, archivedById: null } });
  // If its parent is still in the trash, restore it to the top level.
  if (page.parentId) {
    const parent = await db.page.findUnique({ where: { id: page.parentId }, select: { archivedAt: true } });
    if (parent?.archivedAt) await db.page.update({ where: { id: page.id }, data: { parentId: null } });
  }
  return page;
}

export async function deleteForever(pageId: string, viewer: Viewer) {
  const page = await requireEditablePage(pageId, viewer, "ADMIN");
  if (!page.archivedAt) throw new Error("Move it to the trash first.");
  await db.page.delete({ where: { id: page.id } });
}

/** Copy a page and everything inside it (databases keep their views and rows). */
export async function duplicatePage(pageId: string, viewer: Viewer) {
  const src = await requireEditablePage(pageId, viewer);
  let budget = 300;
  const copy = async (id: string, parentId: string | null, rename: boolean): Promise<string> => {
    const p = await db.page.findUniqueOrThrow({ where: { id }, include: { views: true } });
    const created = await db.page.create({
      data: {
        workspaceId: p.workspaceId,
        parentId,
        kind: p.kind,
        title: rename ? `${p.title || "Untitled"} (copy)` : p.title,
        icon: p.icon,
        coverUrl: p.coverUrl,
        content: (p.content ?? []) as Prisma.InputJsonValue,
        text: p.text,
        schema: (p.schema ?? undefined) as Prisma.InputJsonValue | undefined,
        props: (p.props ?? undefined) as Prisma.InputJsonValue | undefined,
        template: p.template,
        fullWidth: p.fullWidth,
        position: rename ? p.position + 0.5 : p.position,
        createdById: viewer.user.id,
        updatedById: viewer.user.id,
        views: { create: p.views.map((v) => ({ name: v.name, type: v.type, config: v.config as Prisma.InputJsonValue, position: v.position })) },
      },
    });
    const kids = await db.page.findMany({ where: { parentId: id, archivedAt: null }, orderBy: { position: "asc" }, select: { id: true } });
    for (const k of kids) {
      if (--budget <= 0) break;
      await copy(k.id, created.id, false);
    }
    return created.id;
  };
  const id = await copy(src.id, src.parentId, true);
  return db.page.findUniqueOrThrow({ where: { id } });
}

/** Pages across every workspace the viewer belongs to, by title then body text. */
export async function searchPages(viewer: Viewer, q: string, take = 12) {
  const memberships = await db.workspaceMember.findMany({ where: { userId: viewer.user.id }, select: { workspaceId: true } });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const where: Prisma.PageWhereInput = { workspaceId: { in: workspaceIds }, archivedAt: null };
  const select = {
    id: true,
    title: true,
    icon: true,
    kind: true,
    workspace: { select: { slug: true, name: true, kind: true } },
    parent: { select: { title: true, kind: true } },
  } as const;
  if (!q) {
    return db.page.findMany({ where: { ...where, kind: { in: ["PAGE", "DATABASE"] } }, orderBy: { updatedAt: "desc" }, take: 8, select });
  }
  const byTitle = await db.page.findMany({
    where: { ...where, title: { contains: q, mode: "insensitive" } },
    orderBy: { updatedAt: "desc" },
    take,
    select,
  });
  if (byTitle.length >= take) return byTitle;
  const byText = await db.page.findMany({
    where: { ...where, id: { notIn: byTitle.map((p) => p.id) }, text: { contains: q, mode: "insensitive" } },
    orderBy: { updatedAt: "desc" },
    take: take - byTitle.length,
    select,
  });
  return [...byTitle, ...byText];
}
