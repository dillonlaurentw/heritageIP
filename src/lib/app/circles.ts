import "server-only";
import { circleSummaryAgent, runAgent } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { weekOf } from "../app-rules";
import { db } from "../db";
import { notifyUsers } from "../notify";

type Fail = { ok: false; message: string };

export async function circleOf(userId: string) {
  const seat = await db.circleMember.findUnique({ where: { userId }, select: { circleId: true } });
  return seat?.circleId ?? null;
}

/** Your circle this week: the people, their check-ins with replies, and SELF's note. */
export async function loadCircle(userId: string, now = new Date()) {
  const circleId = await circleOf(userId);
  if (!circleId) return null;
  const week = weekOf(now);
  const [circle, checkIns, summary] = await Promise.all([
    db.circle.findUniqueOrThrow({
      where: { id: circleId },
      select: { id: true, name: true, members: { orderBy: { joinedAt: "asc" }, select: { user: { select: { id: true, name: true, profile: { select: { headline: true } } } } } } },
    }),
    db.checkIn.findMany({
      where: { circleId, weekOf: week },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        did: true,
        stuck: true,
        need: true,
        createdAt: true,
        user: { select: { name: true } },
        replies: { orderBy: { createdAt: "asc" }, select: { id: true, text: true, createdAt: true, author: { select: { id: true, name: true } } } },
      },
    }),
    db.circleSummary.findUnique({ where: { circleId_weekOf: { circleId, weekOf: week } } }),
  ]);
  const list = checkIns.map((c) => ({
    id: c.id,
    userId: c.userId,
    name: c.user.name,
    did: c.did,
    stuck: c.stuck,
    need: c.need,
    at: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({ id: r.id, text: r.text, at: r.createdAt.toISOString(), authorId: r.author.id, author: r.author.name })),
  }));
  return {
    id: circle.id,
    name: circle.name,
    weekOf: week.toISOString(),
    members: circle.members.map((m) => ({ id: m.user.id, name: m.user.name, headline: m.user.profile?.headline ?? null, checkedIn: checkIns.some((c) => c.userId === m.user.id) })),
    checkIns: list,
    /** Your own check-in this week, or null. */
    mine: list.find((c) => c.userId === userId) ?? null,
    summary: summary ? { text: summary.text, helps: (summary.helps ?? []) as { from: string; to: string; why: string }[], demo: summary.demo } : null,
  };
}

const clean = (s: string, max: number) => s.trim().slice(0, max);

/** This week's check-in. One per person per week; saving again updates it. */
export async function saveCheckIn(userId: string, input: { did: string; stuck: string; need: string }, now = new Date()): Promise<{ ok: true } | Fail> {
  const circleId = await circleOf(userId);
  if (!circleId) return { ok: false, message: "You're not in a circle yet." };
  const did = clean(input.did, 800);
  if (did.length < 5) return { ok: false, message: "Say what you did this week, even if it was small." };
  const data = { did, stuck: clean(input.stuck, 800), need: clean(input.need, 800) };
  const week = weekOf(now);
  await db.checkIn.upsert({ where: { userId_weekOf: { userId, weekOf: week } }, create: { circleId, userId, weekOf: week, ...data }, update: data });
  return { ok: true };
}

/** "I can help": a reply on someone's check-in, only inside the same circle. */
export async function replyToCheckIn(user: { id: string; name: string }, checkInId: string, text: string): Promise<{ ok: true } | Fail> {
  const body = clean(text, 1000);
  if (body.length < 2) return { ok: false, message: "Write a reply first." };
  const [checkIn, mine] = await Promise.all([
    db.checkIn.findUnique({ where: { id: checkInId }, select: { circleId: true, userId: true } }),
    circleOf(user.id),
  ]);
  if (!checkIn || checkIn.circleId !== mine) return { ok: false, message: "That check-in isn't in your circle." };
  await db.circleReply.create({ data: { checkInId, authorId: user.id, text: body } });
  if (checkIn.userId !== user.id) {
    await notifyUsers({ userIds: [checkIn.userId], actorId: user.id, kind: "COMMENT", text: `${user.name} replied to your check-in`, href: "/home" });
  }
  return { ok: true };
}

/** SELF's note on the circle's week: a summary and who could help whom. Needs two check-ins. */
export async function summariseWeek(userId: string, now = new Date()): Promise<{ ok: true } | Fail> {
  const circleId = await circleOf(userId);
  if (!circleId) return { ok: false, message: "You're not in a circle yet." };
  const week = weekOf(now);
  const [circle, checkIns] = await Promise.all([
    db.circle.findUniqueOrThrow({ where: { id: circleId }, select: { name: true } }),
    db.checkIn.findMany({ where: { circleId, weekOf: week }, select: { did: true, stuck: true, need: true, user: { select: { name: true } } } }),
  ]);
  if (checkIns.length < 2) return { ok: false, message: "The note needs at least two check-ins this week." };
  const res = await runAgent(circleSummaryAgent, { circleName: circle.name, checkIns: checkIns.map((c) => ({ name: c.user.name, did: c.did, stuck: c.stuck, need: c.need })) }, { userId });
  if (!res.ok) return res;
  const data = { text: res.output.summary, helps: res.output.helps as unknown as Prisma.InputJsonValue, demo: res.demo };
  await db.circleSummary.upsert({ where: { circleId_weekOf: { circleId, weekOf: week } }, create: { circleId, weekOf: week, ...data }, update: data });
  return { ok: true };
}
