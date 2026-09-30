import "server-only";
import { circleSummaryAgent, runAgent } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { weekOf } from "../app-rules";
import { db } from "../db";
import { blockedIds } from "./safety";

type Fail = { ok: false; message: string };

/** SELF's one gentle nudge a week. Optional: nobody has to answer it. */
const PROMPTS = [
  "New week. What moved last week, and what's stuck?",
  "What's one thing someone here could help you with this week?",
  "What did you learn last week that surprised you?",
  "What are you avoiding this week?",
];

export async function circleOf(userId: string) {
  const seat = await db.circleMember.findUnique({ where: { userId }, select: { circleId: true } });
  return seat?.circleId ?? null;
}

/** Posts the week's prompt once (the unique key on circle + week makes it idempotent). */
async function ensureWeeklyPrompt(circleId: string, now: Date) {
  const week = weekOf(now);
  const text = PROMPTS[Math.floor(week.getTime() / (7 * 86_400_000)) % PROMPTS.length]!;
  await db.circleMessage.upsert({
    where: { circleId_weekOf: { circleId, weekOf: week } },
    create: { circleId, weekOf: week, text, createdAt: new Date(Math.min(week.getTime() + 8 * 3_600_000, now.getTime())) }, // Monday morning
    update: {},
  });
}

/** Your circle: who's in it, the conversation, and this week's catch-up note. Opening it marks it read. */
export async function loadCircle(userId: string, now = new Date()) {
  const circleId = await circleOf(userId);
  if (!circleId) return null;
  await ensureWeeklyPrompt(circleId, now);
  const [circle, messages, summary, blocked] = await Promise.all([
    db.circle.findUniqueOrThrow({
      where: { id: circleId },
      select: { id: true, name: true, members: { orderBy: { joinedAt: "asc" }, select: { user: { select: { id: true, name: true, profile: { select: { headline: true } } } } } } },
    }),
    db.circleMessage.findMany({
      where: { circleId },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: { id: true, text: true, createdAt: true, fromJournal: true, author: { select: { id: true, name: true } } },
    }),
    db.circleSummary.findUnique({ where: { circleId_weekOf: { circleId, weekOf: weekOf(now) } } }),
    blockedIds(userId),
  ]);
  await db.circleMember.update({ where: { userId }, data: { lastReadAt: now } });
  const week = weekOf(now).getTime();
  const talkedThisWeek = new Set(messages.filter((m) => m.author && m.createdAt.getTime() >= week).map((m) => m.author!.id));
  return {
    id: circle.id,
    name: circle.name,
    members: circle.members.map((m) => ({ id: m.user.id, name: m.user.name, headline: m.user.profile?.headline ?? null, activeThisWeek: talkedThisWeek.has(m.user.id) })),
    // People you blocked (or who blocked you) are quiet here.
    messages: messages.reverse().filter((m) => !m.author || !blocked.has(m.author.id)).map((m) => ({
      id: m.id,
      text: m.text,
      at: m.createdAt.toISOString(),
      fromJournal: m.fromJournal,
      author: m.author ? { id: m.author.id, name: m.author.name } : null, // null = SELF's weekly prompt
    })),
    summary: summary ? { text: summary.text, helps: (summary.helps ?? []) as { from: string; to: string; why: string }[], demo: summary.demo } : null,
  };
}

/** Unread messages from other people since you last opened your circle. */
export async function circleUnread(userId: string) {
  const seat = await db.circleMember.findUnique({ where: { userId }, select: { circleId: true, lastReadAt: true } });
  if (!seat) return 0;
  return db.circleMessage.count({ where: { circleId: seat.circleId, createdAt: { gt: seat.lastReadAt }, authorId: { not: userId } } });
}

/** Say something to your circle. Only members of the circle can. */
export async function postToCircle(userId: string, text: string, opts: { fromJournal?: boolean } = {}): Promise<{ ok: true } | Fail> {
  const circleId = await circleOf(userId);
  if (!circleId) return { ok: false, message: "You're not in a circle yet." };
  const body = text.trim().slice(0, 2000);
  if (!body) return { ok: false, message: "Write something first." };
  await db.circleMessage.create({ data: { circleId, authorId: userId, text: body, fromJournal: !!opts.fromJournal } });
  await db.circleMember.update({ where: { userId }, data: { lastReadAt: new Date() } });
  return { ok: true };
}

/** "Catch me up": a few lines on the circle's week and who could help whom. Needs a real week of talk. */
export async function catchUp(userId: string, now = new Date()): Promise<{ ok: true } | Fail> {
  const circleId = await circleOf(userId);
  if (!circleId) return { ok: false, message: "You're not in a circle yet." };
  const week = weekOf(now);
  const [circle, messages] = await Promise.all([
    db.circle.findUniqueOrThrow({ where: { id: circleId }, select: { name: true } }),
    db.circleMessage.findMany({
      where: { circleId, authorId: { not: null }, createdAt: { gte: week } },
      orderBy: { createdAt: "asc" },
      take: 120,
      select: { text: true, author: { select: { name: true } } },
    }),
  ]);
  if (messages.length < 3) return { ok: false, message: "There isn't much to catch up on yet this week." };
  const res = await runAgent(circleSummaryAgent, { circleName: circle.name, messages: messages.map((m) => ({ name: m.author!.name, text: m.text })) }, { userId });
  if (!res.ok) return res;
  const data = { text: res.output.summary, helps: res.output.helps as unknown as Prisma.InputJsonValue, demo: res.demo };
  await db.circleSummary.upsert({ where: { circleId_weekOf: { circleId, weekOf: week } }, create: { circleId, weekOf: week, ...data }, update: data });
  return { ok: true };
}
