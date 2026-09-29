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
