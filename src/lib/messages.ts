import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { answerTrial, canMessage, canProposeTrial, pairKey, trialTitle, type TrialData } from "./message-rules";
import { notifyUsers } from "./notify";
import type { Viewer } from "./session";
import { logActivity, roleIn } from "./workspaces";

type Fail = { ok: false; message: string };

/** Do these two people work together, or has one said yes to the other? */
export async function mayMessage(aId: string, bId: string) {
  if (aId === bId) return false;
  const [shared, accepted] = await Promise.all([
    db.workspace.count({ where: { kind: "TEAM", AND: [{ members: { some: { userId: aId } } }, { members: { some: { userId: bId } } }] } }),
    db.signal.count({
      where: {
        status: "ACCEPTED",
        OR: [
          { fromUserId: aId, toUserId: bId },
          { fromUserId: bId, toUserId: aId },
        ],
      },
    }),
  ]);
  return canMessage({ sharedWorkspace: shared > 0, acceptedSignal: accepted > 0 });
}

/** Opens (or finds) the one conversation between the viewer and someone they may message. */
export async function openConversation(viewer: Viewer, otherId: string, workspaceId?: string | null): Promise<{ ok: true; id: string } | Fail> {
  if (!(await mayMessage(viewer.user.id, otherId))) {
    return { ok: false, message: "You can message people you work with, or who said yes to a request." };
  }
  const key = pairKey(viewer.user.id, otherId);
  const existing = await db.conversation.findUnique({ where: { pairKey: key }, select: { id: true } });
  if (existing) return { ok: true, id: existing.id };
  const conv = await db.conversation.create({
    data: {
      pairKey: key,
      workspaceId: workspaceId ?? null,
      members: { create: [{ userId: viewer.user.id, lastReadAt: new Date() }, { userId: otherId }] },
    },
    select: { id: true },
  });
  return { ok: true, id: conv.id };
}

/**
 * After someone says yes to a request: open the conversation between the two
 * people (or reuse it) with the request's note as its first message. Callers
 * have already checked the signal was accepted.
 */
export async function conversationFromYes(fromId: string, toId: string, workspaceId: string | null, note: string) {
  const key = pairKey(fromId, toId);
  const conv =
    (await db.conversation.findUnique({ where: { pairKey: key }, select: { id: true } })) ??
    (await db.conversation.create({
      data: { pairKey: key, workspaceId, members: { create: [{ userId: fromId, lastReadAt: new Date() }, { userId: toId, lastReadAt: new Date() }] } },
      select: { id: true },
    }));
  await db.directMessage.create({ data: { conversationId: conv.id, authorId: fromId, text: note } });
  await db.conversation.update({ where: { id: conv.id }, data: { updatedAt: new Date() } });
  return conv.id;
}

/** Your conversations, newest first, with the other person and whether there's something unread. */
export async function listConversations(viewerId: string) {
  const rows = await db.conversationMember.findMany({
    where: { userId: viewerId },
    orderBy: { conversation: { updatedAt: "desc" } },
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          id: true,
          updatedAt: true,
          workspace: { select: { name: true } },
          members: { where: { userId: { not: viewerId } }, select: { user: { select: { id: true, name: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, authorId: true, createdAt: true, kind: true } },
        },
      },
    },
  });
  return rows.map((r) => {
    const last = r.conversation.messages[0] ?? null;
    return {
      id: r.conversation.id,
      other: r.conversation.members[0]?.user ?? { id: "", name: "Someone who left" },
      about: r.conversation.workspace?.name ?? null,
      last: last ? { text: last.kind === "TRIAL_PROPOSAL" ? "Proposed a trial week" : last.text, mine: last.authorId === viewerId, at: last.createdAt } : null,
      unread: !!last && last.authorId !== viewerId && (!r.lastReadAt || last.createdAt > r.lastReadAt),
    };
  });
}

export async function unreadConversations(viewerId: string) {
  return (await listConversations(viewerId)).filter((c) => c.unread).length;
}

async function membership(viewerId: string, conversationId: string) {
  return db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId: viewerId } } });
}

/** A conversation's messages, if the viewer is in it. Marks it read. */
export async function loadThread(viewer: Viewer, conversationId: string, after?: Date) {
  if (!(await membership(viewer.user.id, conversationId))) return null;
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      workspace: { select: { id: true, name: true, slug: true } },
      members: { select: { user: { select: { id: true, name: true, profile: { select: { headline: true } } } } } },
    },
  });
  if (!conv) return null;
  const messages = await db.directMessage.findMany({
    where: { conversationId, ...(after ? { createdAt: { gt: after } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 300,
    select: { id: true, authorId: true, kind: true, text: true, data: true, createdAt: true },
  });
  await db.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId: viewer.user.id } },
    data: { lastReadAt: new Date() },
  });
  const other = conv.members.find((m) => m.user.id !== viewer.user.id)?.user ?? null;
  return { conv, other, messages };
}

export async function sendMessage(viewer: Viewer, conversationId: string, text: string): Promise<{ ok: true } | Fail> {
  const body = text.trim();
  if (!body) return { ok: false, message: "Write something first." };
  if (body.length > 4000) return { ok: false, message: "That's long for a message. Put it in a page and share the link." };
  if (!(await membership(viewer.user.id, conversationId))) return { ok: false, message: "That conversation isn't yours." };
  const other = await db.conversationMember.findFirst({ where: { conversationId, userId: { not: viewer.user.id } }, select: { userId: true } });
  if (!other || !(await mayMessage(viewer.user.id, other.userId))) return { ok: false, message: "You can't message this person any more." };
  await db.directMessage.create({ data: { conversationId, authorId: viewer.user.id, text: body } });
  await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  await db.conversationMember.update({ where: { conversationId_userId: { conversationId, userId: viewer.user.id } }, data: { lastReadAt: new Date() } });
  return { ok: true };
}

/** Companies the viewer could propose a trial week for, to the other person in this conversation. */
export async function trialOptions(viewerId: string, otherId: string) {
  const mine = await db.workspaceMember.findMany({
    where: { userId: viewerId, role: { in: ["OWNER", "ADMIN"] }, workspace: { kind: "TEAM" } },
    select: { workspace: { select: { id: true, name: true, members: { where: { userId: otherId }, select: { id: true } } } } },
  });
  const options = mine.filter((m) => m.workspace.members.length === 0).map((m) => m.workspace);
  const roles = await db.page.findMany({
    where: { workspaceId: { in: options.map((o) => o.id) }, kind: "ROW", archivedAt: null, parent: { systemKey: "roles" } },
    select: { id: true, title: true, workspaceId: true, props: true },
  });
  return options.map((o) => ({
    id: o.id,
    name: o.name,
    roles: roles
      .filter((r) => r.workspaceId === o.id && (() => { const s = (r.props as Record<string, unknown> | null)?.state; return !s || s === "open"; })())
      .map((r) => ({ id: r.id, title: r.title })),
  }));
}

/** A trial week, proposed as a message. No money, no terms: what you'd work on together, for a week. */
export async function proposeTrial(
  viewer: Viewer,
  conversationId: string,
  input: { workspaceId: string; roleId?: string | null; title: string; focus: string },
): Promise<{ ok: true } | Fail> {
  if (!(await membership(viewer.user.id, conversationId))) return { ok: false, message: "That conversation isn't yours." };
  const other = await db.conversationMember.findFirst({ where: { conversationId, userId: { not: viewer.user.id } }, select: { userId: true } });
  if (!other) return { ok: false, message: "There's no one else in this conversation." };
  const ws = await db.workspace.findUnique({ where: { id: input.workspaceId }, select: { id: true, name: true, kind: true } });
  if (!ws || ws.kind !== "TEAM") return { ok: false, message: "Pick one of your companies." };
  const problem = canProposeTrial(await roleIn(ws.id, viewer.user.id), !!(await roleIn(ws.id, other.userId)));
  if (problem) return { ok: false, message: problem };
  const open = await db.directMessage.findFirst({
    where: { conversationId, kind: "TRIAL_PROPOSAL", data: { path: ["status"], equals: "PENDING" } },
    select: { id: true },
  });
  if (open) return { ok: false, message: "There's already a trial week waiting for an answer here." };
  const title = input.title.trim();
  if (!title) return { ok: false, message: "Say what they'd work on." };
  const data: TrialData = { workspaceId: ws.id, workspaceName: ws.name, roleId: input.roleId ?? null, title, focus: input.focus.trim(), status: "PENDING" };
  await db.directMessage.create({
    data: { conversationId, authorId: viewer.user.id, kind: "TRIAL_PROPOSAL", text: `A trial week at ${ws.name}: ${title}`, data: data as unknown as Prisma.InputJsonValue },
  });
  await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date(), workspaceId: ws.id } });
  await notifyUsers({
    userIds: [other.userId],
    actorId: viewer.user.id,
    kind: "SYSTEM",
    text: `${viewer.user.name} proposed a trial week at ${ws.name}`,
    href: `/messages/${conversationId}`,
  });
  return { ok: true };
}

/**
 * Accept, pass on, or withdraw a trial week. Accepting adds the person to the
 * company as a member with a "Trial week" title: the owner proposed it, the
 * person said yes. Nothing about money or terms is involved.
 */
export async function answerTrialProposal(viewer: Viewer, messageId: string, action: "accept" | "decline" | "withdraw"): Promise<{ ok: true } | Fail> {
  const msg = await db.directMessage.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true, authorId: true, kind: true, data: true } });
  if (!msg || msg.kind !== "TRIAL_PROPOSAL" || !(await membership(viewer.user.id, msg.conversationId))) return { ok: false, message: "That proposal doesn't exist." };
  const trial = msg.data as unknown as TrialData;
  const res = answerTrial(trial, viewer.user.id, msg.authorId, action);
  if (!res.ok) return { ok: false, message: res.reason };

  const next: TrialData = { ...trial, status: res.status, answeredAt: new Date().toISOString() };
  // Only move from PENDING: a double click can't answer twice.
  const { count } = await db.directMessage.updateMany({
    where: { id: msg.id, data: { path: ["status"], equals: "PENDING" } },
    data: { data: next as unknown as Prisma.InputJsonValue },
  });
  if (!count) return { ok: false, message: "This proposal was already answered." };

  if (res.status === "ACCEPTED") {
    const proposerRole = await roleIn(trial.workspaceId, msg.authorId);
    if (proposerRole !== "OWNER" && proposerRole !== "ADMIN") return { ok: false, message: "The person who proposed this can't add people any more." };
    await db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: trial.workspaceId, userId: viewer.user.id } },
      create: { workspaceId: trial.workspaceId, userId: viewer.user.id, role: "MEMBER", title: trialTitle(trial.title) },
      update: {},
    });
    await logActivity(trial.workspaceId, viewer.user.id, "member.joined", null, { title: trialTitle(trial.title) });
  }
  const line =
    res.status === "ACCEPTED"
      ? `${viewer.user.name} said yes to the trial week and joined ${trial.workspaceName}.`
      : res.status === "DECLINED"
        ? `${viewer.user.name} passed on the trial week for now.`
        : `${viewer.user.name} withdrew the trial week.`;
  await db.directMessage.create({ data: { conversationId: msg.conversationId, authorId: viewer.user.id, kind: "NOTE", text: line } });
  await db.conversation.update({ where: { id: msg.conversationId }, data: { updatedAt: new Date() } });
  if (action !== "withdraw") {
    await notifyUsers({ userIds: [msg.authorId], actorId: viewer.user.id, kind: "SYSTEM", text: line, href: `/messages/${msg.conversationId}` });
  }
  return { ok: true };
}
