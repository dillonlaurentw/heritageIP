import "server-only";
import type { NotificationKind } from "@/generated/prisma/enums";
import { db } from "./db";
import { sendEmail } from "./email";

const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/**
 * Tell people something happened: an inbox row each, plus an email when it
 * matters (mentions, requests, accepted intros). Never notifies the actor,
 * and for workspace things, only people who are still members.
 */
export async function notifyUsers(input: {
  userIds: string[];
  actorId: string;
  kind: NotificationKind;
  text: string;
  href: string;
  workspaceId?: string | null;
  pageId?: string | null;
  commentId?: string | null;
  email?: { subject: string; body: string };
}) {
  let ids = [...new Set(input.userIds)].filter((id) => id && id !== input.actorId);
  if (input.workspaceId && ids.length) {
    const members = await db.workspaceMember.findMany({ where: { workspaceId: input.workspaceId, userId: { in: ids } }, select: { userId: true } });
    const ok = new Set(members.map((m) => m.userId));
    ids = ids.filter((id) => ok.has(id));
  }
  if (!ids.length) return 0;
  await db.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      actorId: input.actorId,
      kind: input.kind,
      text: input.text,
      href: input.href,
      workspaceId: input.workspaceId ?? null,
      pageId: input.pageId ?? null,
      commentId: input.commentId ?? null,
    })),
  });
  if (input.email) {
    const users = await db.user.findMany({ where: { id: { in: ids } }, select: { email: true } });
    await Promise.all(users.map((u) => sendEmail({ to: u.email, subject: input.email!.subject, text: `${input.email!.body}\n\n${appUrl()}${input.href}` })));
  }
  return ids.length;
}
