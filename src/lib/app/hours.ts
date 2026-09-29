import "server-only";
import { bookingProblem } from "../app-rules";
import { db } from "../db";
import { notifyUsers } from "../notify";

type Fail = { ok: false; message: string };

/** Mentors taking requests, with their next open office hours. */
export async function listMentors(now = new Date()) {
  const mentors = await db.profile.findMany({
    where: { roles: { has: "MENTOR" }, mentorOpen: true, onboardedAt: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: { userId: true, headline: true, focusAreas: true, mentorNote: true, user: { select: { name: true } } },
  });
  const slots = await db.officeHour.findMany({
    where: { mentorId: { in: mentors.map((m) => m.userId) }, startsAt: { gt: now }, bookedById: null },
    orderBy: { startsAt: "asc" },
    select: { id: true, mentorId: true, startsAt: true, minutes: true },
  });
  return mentors
    .map((m) => {
      const mine = slots.filter((s) => s.mentorId === m.userId);
      return {
        id: m.userId,
        name: m.user.name,
        headline: m.headline,
        focus: m.focusAreas,
        note: m.mentorNote,
        openSlots: mine.length,
        next: mine[0] ? { id: mine[0].id, at: mine[0].startsAt.toISOString(), minutes: mine[0].minutes } : null,
      };
    })
    .sort((a, b) => b.openSlots - a.openSlots);
}

export async function mentorDetail(mentorId: string, viewerId: string, now = new Date()) {
  const m = await db.profile.findFirst({
    where: { userId: mentorId, roles: { has: "MENTOR" } },
    select: { userId: true, headline: true, location: true, focusAreas: true, mentorNote: true, mentorOpen: true, user: { select: { name: true } } },
  });
  if (!m) return null;
  const slots = await db.officeHour.findMany({
    where: { mentorId, startsAt: { gt: now }, OR: [{ bookedById: null }, { bookedById: viewerId }] },
    orderBy: { startsAt: "asc" },
    take: 12,
    select: { id: true, startsAt: true, minutes: true, bookedById: true, topic: true },
  });
  return {
    id: m.userId,
    name: m.user.name,
    headline: m.headline,
    location: m.location,
    focus: m.focusAreas,
    note: m.mentorNote,
    open: m.mentorOpen,
    slots: slots.map((s) => ({ id: s.id, at: s.startsAt.toISOString(), minutes: s.minutes, mine: s.bookedById === viewerId, topic: s.bookedById === viewerId ? s.topic : null })),
  };
}

/** Book one short slot, against a real problem. One live booking per mentor at a time. */
export async function bookHour(user: { id: string; name: string }, slotId: string, topic: string, now = new Date()): Promise<{ ok: true } | Fail> {
  const t = topic.trim();
  if (t.length < 15) return { ok: false, message: "Say what you want help with, so they can prepare." };
  const slot = await db.officeHour.findUnique({ where: { id: slotId } });
  if (!slot) return { ok: false, message: "That slot doesn't exist any more." };
  const already = await db.officeHour.count({ where: { mentorId: slot.mentorId, bookedById: user.id, startsAt: { gt: now } } });
  const problem = bookingProblem(slot, user.id, now, already > 0);
  if (problem) return { ok: false, message: problem };
  const { count } = await db.officeHour.updateMany({ where: { id: slot.id, bookedById: null }, data: { bookedById: user.id, topic: t.slice(0, 600), bookedAt: now } });
  if (!count) return { ok: false, message: "Someone just booked this slot." };
  await notifyUsers({
    userIds: [slot.mentorId],
    actorId: user.id,
    kind: "SIGNAL",
    text: `${user.name} booked your office hour: ${t.slice(0, 80)}`,
    href: "/home",
    email: { subject: `${user.name} booked an office hour`, body: `${user.name} booked ${slot.minutes} minutes with you on ${slot.startsAt.toUTCString()}.\n\nWhat they want help with:\n${t}` },
  });
  return { ok: true };
}

/** Your upcoming office hours, as a founder (booked) or as a mentor (offered and booked). */
export async function myHours(userId: string, now = new Date()) {
  const rows = await db.officeHour.findMany({
    where: { startsAt: { gt: now }, OR: [{ bookedById: userId }, { mentorId: userId, bookedById: { not: null } }] },
    orderBy: { startsAt: "asc" },
    take: 5,
    select: { id: true, startsAt: true, minutes: true, topic: true, mentor: { select: { id: true, name: true } }, bookedBy: { select: { id: true, name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    at: r.startsAt.toISOString(),
    minutes: r.minutes,
    topic: r.topic,
    with: r.mentor.id === userId ? r.bookedBy!.name : r.mentor.name,
    mentorId: r.mentor.id,
    role: r.mentor.id === userId ? ("mentor" as const) : ("founder" as const),
  }));
}
