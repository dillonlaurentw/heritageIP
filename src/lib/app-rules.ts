/**
 * The SELF app, stage 1 (founding circles): pure rules, unit tested in
 * __tests__/app-rules.test.ts. Server code lives in src/lib/app/*.
 */

export const CIRCLE_SIZE = 6;
export const INVITES_PER_MEMBER = 3;

/** The Monday (UTC, midnight) of the week a date falls in. Check-ins are per week. */
export function weekOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7; // Monday = 0
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
/** A readable invite code: SELF-XXXX-XXXX. `rand` returns numbers in [0, 1). */
export function newInviteCode(rand: () => number = Math.random): string {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join("");
  return `SELF-${part()}-${part()}`;
}

/** Normalises what someone typed: case, spaces and a missing prefix don't matter. */
export function normaliseCode(input: string): string | null {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = s.startsWith("SELF") ? s.slice(4) : s;
  if (body.length !== 8) return null;
  return `SELF-${body.slice(0, 4)}-${body.slice(4)}`;
}

/** Which circle a new member joins: the fullest one that still has room, else a new one. */
export function circleToJoin(circles: { id: string; size: number }[], max = CIRCLE_SIZE): string | null {
  const open = circles.filter((c) => c.size < max).sort((a, b) => b.size - a.size);
  return open[0]?.id ?? null;
}

/** Can this person book this office hour? */
export function bookingProblem(
  slot: { mentorId: string; startsAt: Date; bookedById: string | null },
  viewerId: string,
  now: Date,
  alreadyBookedWithMentor: boolean,
): string | null {
  if (slot.mentorId === viewerId) return "That's your own office hour.";
  if (slot.bookedById) return slot.bookedById === viewerId ? "You've already booked this one." : "Someone just booked this slot.";
  if (slot.startsAt.getTime() <= now.getTime()) return "That slot has passed.";
  if (alreadyBookedWithMentor) return "You already have a slot with this mentor. Keep one at a time, so everyone gets a turn.";
  return null;
}

/** Applications are about doing, not status: both answers have to say something. */
export function applicationProblem(a: { building: string; lastWeek: string }): string | null {
  if (a.building.trim().length < 20) return "Tell us a little more about what you're building.";
  if (a.lastWeek.trim().length < 20) return "Tell us what you actually did on it last week.";
  if (a.building.length > 1000 || a.lastWeek.length > 1000) return "Keep each answer under 1,000 characters.";
  return null;
}
