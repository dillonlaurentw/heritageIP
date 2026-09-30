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

/** What someone builds in. Only used to match circles; shown as words, never as a label on a person. */
export const FIELDS = {
  FOOD: "Food",
  CLIMATE: "Climate",
  HEALTH: "Health",
  MONEY: "Money and fintech",
  SOFTWARE: "Software",
  CONSUMER: "Consumer",
  HARDWARE: "Hardware",
  OTHER: "Something else",
} as const;
export type Field = keyof typeof FIELDS;

/** How far along. Same idea: matching only. */
export const STAGES = {
  IDEA: "Shaping the idea",
  BUILDING: "Building the first version",
  FIRST_CUSTOMERS: "Finding first customers",
  GROWING: "Growing",
} as const;
export type Stage = keyof typeof STAGES;

const FIELD_NAME: Record<Field, string> = {
  FOOD: "Food founders",
  CLIMATE: "Climate founders",
  HEALTH: "Health founders",
  MONEY: "Fintech founders",
  SOFTWARE: "Software founders",
  CONSUMER: "Consumer founders",
  HARDWARE: "Hardware founders",
  OTHER: "Founders",
};
const STAGE_NAME: Record<Stage, string> = {
  IDEA: "early ideas",
  BUILDING: "first builds",
  FIRST_CUSTOMERS: "first customers",
  GROWING: "growing",
};

export const isField = (v: unknown): v is Field => typeof v === "string" && v in FIELDS;
export const isStage = (v: unknown): v is Stage => typeof v === "string" && v in STAGES;

/** A circle is named after what its members share: "Food founders · first customers". */
export function circleName(field: string | null, stage: string | null): string {
  const f = isField(field) ? FIELD_NAME[field] : "Founders";
  return isStage(stage) ? `${f} · ${STAGE_NAME[stage]}` : f;
}

type CircleSeat = { id: string; field: string | null; stage: string | null; size: number };

/**
 * Which circle someone joins: the fullest one with room that shares their
 * field and stage, else their field, else null (start a new one named after
 * them). Fullest first so circles fill up instead of staying thin.
 */
export function circleFor(person: { field: string | null; stage: string | null }, circles: CircleSeat[], max = CIRCLE_SIZE): string | null {
  if (!person.field) return null;
  const open = circles.filter((c) => c.size < max && c.field === person.field).sort((a, b) => b.size - a.size);
  return (open.find((c) => c.stage === person.stage) ?? open[0])?.id ?? null;
}

/** A request to a mentor has to say what you'd like help with. */
export function mentorAskProblem(note: string): string | null {
  const t = note.trim();
  if (t.length < 20) return "Say a little about what you're building and what you'd like help with.";
  if (t.length > 1000) return "Keep it under 1,000 characters. You can say more once they say yes.";
  return null;
}

/** The day a journal entry belongs to (UTC date, midnight). */
export function dayOf(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Applications are about doing, not status: both answers have to say something. */
export function applicationProblem(a: { building: string; lastWeek: string }): string | null {
  if (a.building.trim().length < 20) return "Tell us a little more about what you're building.";
  if (a.lastWeek.trim().length < 20) return "Tell us what you actually did on it last week.";
  if (a.building.length > 1000 || a.lastWeek.length > 1000) return "Keep each answer under 1,000 characters.";
  return null;
}

// ── Opportunities ────────────────────────────────────────────

export const OPPORTUNITY_KINDS = {
  DINNER: "Founder dinner",
  TRIP: "Trip",
  WORKSHOP: "Workshop",
  EVENT: "A seat at an event",
  INTRO_DAY: "Intro day",
} as const;

/** Who may host: mentors, partners, backers and SELF's admins. Never paid placement. */
export const mayHost = (roles: string[]) => roles.some((r) => r === "MENTOR" || r === "PARTNER" || r === "BACKER" || r === "ADMIN");

type OppFit = { fields: string[]; stages: string[]; buildingOnly: boolean; hostId: string };
type Person = { id: string; field: string | null; stage: string | null; buildingLately: boolean };

/**
 * Does an opportunity fit this person, and why? Returns the reasons in words
 * (shown to them: "You build in food", …) or null when it isn't for them.
 * Never a score: it fits or it doesn't, and it says why.
 */
export function opportunityFit(o: OppFit, p: Person): string[] | null {
  if (o.hostId === p.id) return null;
  const why: string[] = [];
  if (o.fields.length) {
    if (!p.field || !o.fields.includes(p.field)) return null;
    why.push(`You build in ${(FIELDS[p.field as Field] ?? p.field).toLowerCase()}`);
  }
  if (o.stages.length) {
    if (!p.stage || !o.stages.includes(p.stage)) return null;
    why.push(`you're ${(STAGES[p.stage as Stage] ?? p.stage).toLowerCase()}`);
  }
  if (o.buildingOnly) {
    if (!p.buildingLately) return null;
    why.push("you've been building these last two weeks");
  }
  if (!why.length) why.push("It's open to every member");
  return why;
}

/** "You build in food, you're finding first customers and …" */
export function fitSentence(why: string[]): string {
  const [first, ...rest] = why;
  if (!first) return "";
  const head = first[0]!.toUpperCase() + first.slice(1);
  if (!rest.length) return `${head}.`;
  return `${head}${rest.length > 1 ? `, ${rest.slice(0, -1).join(", ")}` : ""} and ${rest[rest.length - 1]}.`;
}

/** Can this person ask to come? */
export function requestProblem(o: { startsAt: Date; closedAt: Date | null }, why: string, now: Date): string | null {
  if (o.closedAt) return "The host isn't taking requests for this one any more.";
  if (o.startsAt.getTime() <= now.getTime()) return "This one has already happened.";
  const t = why.trim();
  if (t.length < 15) return "Say in a line why you'd like to come.";
  if (t.length > 500) return "Keep it to a few lines.";
  return null;
}

/** Can the host pick one more person? */
export function pickProblem(seats: number, picked: number): string | null {
  return picked >= seats ? "Every seat is taken. Add a seat, or say not this time." : null;
}

/** An opportunity the host is creating: sensible, and no money asked through SELF. */
export function opportunityProblem(o: { title: string; description: string; seats: number; startsAt: Date; costNote?: string | null }, now: Date): string | null {
  if (o.title.trim().length < 4) return "Give it a short title.";
  if (o.description.trim().length < 20) return "Say a little about what it is.";
  if (!Number.isInteger(o.seats) || o.seats < 1 || o.seats > 200) return "Seats should be between 1 and 200.";
  if (o.startsAt.getTime() <= now.getTime()) return "Pick a date in the future.";
  if (o.costNote && /pay (via|through|on) self|self (collects|charges)/i.test(o.costNote)) return "SELF doesn't take payments. Say who covers the cost, or link to where people pay.";
  return null;
}
