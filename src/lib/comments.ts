import "server-only";
import { db } from "./db";
import { notifyUsers } from "./notify";
import { pageHref } from "./pages";
import type { Viewer } from "./session";
import { canManage } from "./workspace-rules";
import { logActivity, requireWorkspaceRole } from "./workspaces";

/** Comments on a page, as threads (top-level comments with their replies). Anyone in the workspace can read and comment. */
export async function listThreads(pageId: string, viewer: Viewer) {
  const page = await db.page.findUniqueOrThrow({ where: { id: pageId }, select: { workspaceId: true } });
  await requireWorkspaceRole(page.workspaceId, viewer, "GUEST");
  const rows = await db.comment.findMany({
    where: { pageId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      parentId: true,
      blockId: true,
      quote: true,
      body: true,
      resolvedAt: true,
      createdAt: true,
      authorId: true,
      author: { select: { name: true } },
    },
  });
  const view = (c: (typeof rows)[number]) => ({
    id: c.id,
    body: c.body,
    author: c.author.name,
    authorId: c.authorId,
    at: c.createdAt.toISOString(),
  });
  return rows
    .filter((c) => !c.parentId)
    .map((c) => ({
      ...view(c),
      blockId: c.blockId,
      quote: c.quote,
      resolved: Boolean(c.resolvedAt),
      replies: rows.filter((r) => r.parentId === c.id).map(view),
    }));
}
export type Thread = Awaited<ReturnType<typeof listThreads>>[number];

export async function addComment(
  viewer: Viewer,
  input: { pageId: string; body: string; mentions: string[]; blockId?: string | null; quote?: string | null; parentId?: string | null },
) {
  const page = await db.page.findUniqueOrThrow({
    where: { id: input.pageId },
    select: { id: true, title: true, workspaceId: true, createdById: true, workspace: { select: { slug: true, kind: true } } },
  });
  await requireWorkspaceRole(page.workspaceId, viewer, "GUEST");
  let parent: { id: string; authorId: string } | null = null;
  if (input.parentId) {
    parent = await db.comment.findFirst({ where: { id: input.parentId, pageId: page.id, parentId: null }, select: { id: true, authorId: true } });
    if (!parent) throw new Error("That thread no longer exists.");
  }
  const comment = await db.comment.create({
    data: {
      pageId: page.id,
      authorId: viewer.user.id,
      body: input.body,
      parentId: parent?.id ?? null,
      blockId: parent ? null : (input.blockId ?? null),
      quote: parent ? null : (input.quote ?? null),
    },
  });
  if (parent) await db.comment.update({ where: { id: parent.id }, data: { resolvedAt: null } });

  const title = page.title || "Untitled";
  const href = `${pageHref(page.workspace.slug, page.id)}?comment=${parent?.id ?? comment.id}`;
  const snippet = input.body.length > 140 ? `${input.body.slice(0, 139)}…` : input.body;
  const mentioned = new Set(input.mentions);
  // @mentions: inbox + email.
  await notifyUsers({
    userIds: [...mentioned],
    actorId: viewer.user.id,
    kind: "MENTION",
    text: `${viewer.user.name} mentioned you in a comment on “${title}”`,
    href,
    workspaceId: page.workspaceId,
    pageId: page.id,
    commentId: comment.id,
    email: { subject: `${viewer.user.name} mentioned you on ${title}`, body: `"${snippet}"` },
  });
  // Everyone else in the conversation: the page's creator and the thread's people. Inbox only.
  const thread = parent
    ? await db.comment.findMany({ where: { OR: [{ id: parent.id }, { parentId: parent.id }] }, select: { authorId: true } })
    : [];
  await notifyUsers({
    userIds: [page.createdById, ...thread.map((t) => t.authorId)].filter((id) => !mentioned.has(id)),
    actorId: viewer.user.id,
    kind: "COMMENT",
    text: `${viewer.user.name} ${parent ? "replied" : "commented"} on “${title}”: ${snippet}`,
    href,
    workspaceId: page.workspaceId,
    pageId: page.id,
    commentId: comment.id,
  });
  if (page.workspace.kind === "TEAM") await logActivity(page.workspaceId, viewer.user.id, "comment.added", page.id, { title });
  return comment.id;
}

/** Resolve or reopen a thread. Anyone who can comment can do this. */
export async function setResolved(commentId: string, resolved: boolean, viewer: Viewer) {
  const c = await db.comment.findUniqueOrThrow({ where: { id: commentId }, select: { id: true, parentId: true, page: { select: { workspaceId: true } } } });
  await requireWorkspaceRole(c.page.workspaceId, viewer, "GUEST");
  if (c.parentId) throw new Error("Resolve the thread, not a reply.");
  await db.comment.update({ where: { id: c.id }, data: { resolvedAt: resolved ? new Date() : null } });
}

/** Delete a comment: its author, or a workspace admin. */
export async function deleteComment(commentId: string, viewer: Viewer) {
  const c = await db.comment.findUniqueOrThrow({ where: { id: commentId }, select: { id: true, authorId: true, page: { select: { workspaceId: true } } } });
  const role = await requireWorkspaceRole(c.page.workspaceId, viewer, "GUEST");
  if (c.authorId !== viewer.user.id && !canManage(role)) throw new Error("Only the author or an admin can delete this.");
  await db.comment.delete({ where: { id: c.id } });
}

/** People newly @mentioned in a page body: inbox + email. Only workspace members are notified. */
export async function notifyPageMentions(pageId: string, userIds: string[], viewer: Viewer) {
  const page = await db.page.findUniqueOrThrow({ where: { id: pageId }, select: { id: true, title: true, workspaceId: true, workspace: { select: { slug: true } } } });
  await requireWorkspaceRole(page.workspaceId, viewer, "MEMBER");
  const title = page.title || "Untitled";
  return notifyUsers({
    userIds,
    actorId: viewer.user.id,
    kind: "MENTION",
    text: `${viewer.user.name} mentioned you in “${title}”`,
    href: pageHref(page.workspace.slug, page.id),
    workspaceId: page.workspaceId,
    pageId: page.id,
    email: { subject: `${viewer.user.name} mentioned you on ${title}`, body: `${viewer.user.name} mentioned you on the page "${title}".` },
  });
}
