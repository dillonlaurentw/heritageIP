"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addComment, deleteComment, listThreads, notifyPageMentions, setResolved } from "@/lib/comments";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";

const id = z.string().min(1).max(64);
type Result = { ok: true } | { ok: false; message: string };
const oops = (e: unknown): { ok: false; message: string } => ({
  ok: false,
  message: e instanceof Error && e.message !== "Not allowed." ? e.message : "Couldn't do that.",
});

export async function loadThreads(pageId: string) {
  const viewer = await requireOnboarded();
  return listThreads(id.parse(pageId), viewer);
}

const commentInput = z.object({
  pageId: id,
  body: z.string().trim().min(1, "Write something first.").max(4000),
  mentions: z.array(id).max(20).default([]),
  blockId: z.string().max(64).nullable().optional(),
  quote: z.string().max(300).nullable().optional(),
  parentId: id.nullable().optional(),
});

export async function postComment(input: z.input<typeof commentInput>): Promise<Result> {
  const viewer = await requireOnboarded();
  const parsed = commentInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  try {
    await addComment(viewer, parsed.data);
    return { ok: true };
  } catch (e) {
    return oops(e);
  }
}

export async function resolveThread(commentId: string, resolved: boolean): Promise<Result> {
  const viewer = await requireOnboarded();
  try {
    await setResolved(id.parse(commentId), z.boolean().parse(resolved), viewer);
    return { ok: true };
  } catch (e) {
    return oops(e);
  }
}

export async function removeComment(commentId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  try {
    await deleteComment(id.parse(commentId), viewer);
    return { ok: true };
  } catch (e) {
    return oops(e);
  }
}

/** Called by the editor after a save that added @mentions. */
export async function notifyMentions(pageId: string, userIds: string[]) {
  const viewer = await requireOnboarded();
  try {
    await notifyPageMentions(id.parse(pageId), z.array(id).max(20).parse(userIds), viewer);
  } catch {
    // Mentions are best-effort; the page itself saved fine.
  }
}

// ── Inbox ─────────────────────────────────────────────────────

export async function markRead(ids: string[]) {
  const viewer = await requireOnboarded();
  await db.notification.updateMany({
    where: { id: { in: z.array(id).max(200).parse(ids) }, userId: viewer.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

export async function markAllRead() {
  const viewer = await requireOnboarded();
  await db.notification.updateMany({ where: { userId: viewer.user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}
