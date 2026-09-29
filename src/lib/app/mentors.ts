import "server-only";
import { mentorAskProblem } from "../app-rules";
import { db } from "../db";
import { sendEmail } from "../email";
import { pairKey } from "../message-rules";
import { actOnSignal } from "../network";
import type { Viewer } from "../session";

type Fail = { ok: false; message: string };
const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/**
 * Mentors on the app: you ask for mentorship with a note, they say yes or not
 * now, and a yes opens a conversation. No slots, no fixed length: who helps
 * you changes over time, and the two of you decide how to work together.
 * A request is an ordinary MENTOR_REQUEST signal, so contact rules still apply.
 */

type AskState = { status: "none" } | { status: "pending"; since: string } | { status: "yes"; conversationId: string | null } | { status: "not now" };

async function askStates(viewerId: string, mentorIds: string[]) {
  const sigs = await db.signal.findMany({
    where: { kind: "MENTOR_REQUEST", fromUserId: viewerId, toUserId: { in: mentorIds } },
    orderBy: { createdAt: "desc" },
    select: { toUserId: true, status: true, createdAt: true },
  });
  const convs = await db.conversation.findMany({ where: { pairKey: { in: mentorIds.map((m) => pairKey(viewerId, m)) } }, select: { id: true, pairKey: true } });
  const out = new Map<string, AskState>();
  for (const id of mentorIds) {
    const s = sigs.find((x) => x.toUserId === id); // newest first
    const conv = convs.find((c) => c.pairKey === pairKey(viewerId, id));
    out.set(
      id,
      !s || s.status === "WITHDRAWN"
        ? { status: "none" }
        : s.status === "PENDING"
          ? { status: "pending", since: s.createdAt.toISOString() }
          : s.status === "ACCEPTED"
            ? { status: "yes", conversationId: conv?.id ?? null }
            : { status: "not now" },
    );
  }
  return out;
}

/** Mentors taking requests, with where you stand with each. */
export async function listMentors(viewerId: string) {
  const mentors = await db.profile.findMany({
    where: { roles: { has: "MENTOR" }, onboardedAt: { not: null }, userId: { not: viewerId } },
    orderBy: [{ mentorOpen: "desc" }, { updatedAt: "desc" }],
    select: { userId: true, headline: true, focusAreas: true, mentorNote: true, mentorOpen: true, user: { select: { name: true } } },
  });
  const states = await askStates(viewerId, mentors.map((m) => m.userId));
  return mentors.map((m) => ({
    id: m.userId,
    name: m.user.name,
    headline: m.headline,
    focus: m.focusAreas,
    note: m.mentorNote,
    open: m.mentorOpen,
    ask: states.get(m.userId)!,
  }));
}

export async function mentorDetail(mentorId: string, viewerId: string) {
  const m = await db.profile.findFirst({
    where: { userId: mentorId, roles: { has: "MENTOR" } },
    select: { userId: true, headline: true, location: true, focusAreas: true, mentorNote: true, mentorOpen: true, user: { select: { name: true } } },
  });
  if (!m) return null;
  const states = await askStates(viewerId, [mentorId]);
  return {
    id: m.userId,
    name: m.user.name,
    headline: m.headline,
    location: m.location,
    focus: m.focusAreas,
    note: m.mentorNote,
    open: m.mentorOpen,
    ask: states.get(mentorId)!,
  };
}

/** Ask someone to mentor you. One live request per mentor. */
export async function askMentor(viewer: Viewer, mentorId: string, note: string): Promise<{ ok: true } | Fail> {
  const problem = mentorAskProblem(note);
  if (problem) return { ok: false, message: problem };
  if (mentorId === viewer.user.id) return { ok: false, message: "You can't mentor yourself." };
  const mentor = await db.profile.findUnique({ where: { userId: mentorId }, select: { roles: true, mentorOpen: true, user: { select: { name: true, email: true } } } });
  if (!mentor || !mentor.roles.includes("MENTOR")) return { ok: false, message: "That person isn't a mentor on SELF." };
  if (!mentor.mentorOpen) return { ok: false, message: `${mentor.user.name} isn't taking new requests right now.` };
  const live = await db.signal.count({ where: { kind: "MENTOR_REQUEST", fromUserId: viewer.user.id, toUserId: mentorId, status: { in: ["PENDING", "ACCEPTED"] } } });
  if (live) return { ok: false, message: `You've already asked ${mentor.user.name}.` };

  // If they run a company on SELF, the request carries it (the mentor sees its name).
  const company = await db.workspaceMember.findFirst({
    where: { userId: viewer.user.id, role: { in: ["OWNER", "ADMIN"] }, workspace: { kind: "TEAM" } },
    orderBy: { joinedAt: "asc" },
    select: { workspace: { select: { id: true, name: true } } },
  });
  const signal = await db.signal.create({
    data: { kind: "MENTOR_REQUEST", fromUserId: viewer.user.id, toUserId: mentorId, workspaceId: company?.workspace.id ?? null, note: note.trim() },
  });
  await db.notification.create({
    data: { userId: mentorId, actorId: viewer.user.id, kind: "SIGNAL", text: `${viewer.user.name} asked you to mentor them`, href: "/network/connections", signalId: signal.id },
  });
  await sendEmail({
    to: mentor.user.email,
    subject: `${viewer.user.name} would like you to mentor them`,
    text: `${viewer.user.name}${company ? ` (${company.workspace.name})` : ""} wrote:\n\n"${note.trim()}"\n\nSay yes or not now in the SELF app, or at ${appUrl()}/network/connections`,
  });
  return { ok: true };
}

/** Requests waiting for you to answer (mentors see who asked them). */
export async function incomingRequests(userId: string) {
  const rows = await db.signal.findMany({
    where: { kind: "MENTOR_REQUEST", toUserId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { id: true, note: true, createdAt: true, fromUser: { select: { id: true, name: true, profile: { select: { headline: true } } } }, workspace: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    note: r.note,
    at: r.createdAt.toISOString(),
    from: { id: r.fromUser.id, name: r.fromUser.name, headline: r.fromUser.profile?.headline ?? null },
    company: r.workspace?.name ?? null,
  }));
}

/** Yes opens a conversation seeded with their note; not now closes it kindly. */
export async function answerRequest(viewer: Viewer, signalId: string, yes: boolean): Promise<{ ok: true; conversationId: string | null } | Fail> {
  const sig = await db.signal.findUnique({ where: { id: signalId }, select: { kind: true, toUserId: true, fromUserId: true } });
  if (!sig || sig.kind !== "MENTOR_REQUEST" || sig.toUserId !== viewer.user.id) return { ok: false, message: "That request isn't yours to answer." };
  const res = await actOnSignal(signalId, viewer, yes ? "accept" : "decline");
  if (!res.ok) return res;
  const conv = yes ? await db.conversation.findUnique({ where: { pairKey: pairKey(sig.fromUserId, sig.toUserId) }, select: { id: true } }) : null;
  return { ok: true, conversationId: conv?.id ?? null };
}
