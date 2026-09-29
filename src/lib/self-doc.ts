/**
 * Your Self: the AI version of you, written as short lines you can read and
 * change. Stored as JSON on Profile.selfDoc. Pure (no DB), unit tested in
 * __tests__/self-doc.test.ts.
 *
 * The persona your agent is given is rendered from exactly these lines.
 * Suggestions ("Is this you?") never count until you accept them.
 */
import { z } from "zod";

export const FACETS = ["BELIEVE", "WHY", "DECIDE", "ENERGY", "STRENGTHS", "NONNEG", "TOWARD"] as const;
export type Facet = (typeof FACETS)[number];

export const FACET_COPY: Record<Facet, { label: string; hint: string; persona: string }> = {
  BELIEVE: { label: "What you believe", hint: "Something you believe that most people don't.", persona: "Believes" },
  WHY: { label: "Why you build", hint: "The reason under the idea.", persona: "Builds because" },
  DECIDE: { label: "How you decide", hint: "How you make hard calls and handle disagreement.", persona: "Decides" },
  ENERGY: { label: "What gives you energy, and what drains it", hint: "When you're at your best, and what wears you down.", persona: "Energy" },
  STRENGTHS: { label: "Where you're strong, and where you need others", hint: "What you bring, and what you'd rather someone else owned.", persona: "Strengths and gaps" },
  NONNEG: { label: "Non-negotiables", hint: "Lines you won't cross, whatever it costs.", persona: "Won't compromise on" },
  TOWARD: { label: "What you're building toward", hint: "The long arc, not the product.", persona: "Building toward" },
};

export const SOURCES = ["onboarding", "you", "thesis", "suggestion"] as const;
export type SelfSource = (typeof SOURCES)[number];

export const SOURCE_COPY: Record<SelfSource, string> = {
  onboarding: "from onboarding",
  you: "you wrote this",
  thesis: "from your thesis",
  suggestion: "you said yes to this",
};

const lineSchema = z.object({
  id: z.string(),
  facet: z.enum(FACETS),
  text: z.string(),
  source: z.enum(SOURCES),
  edited: z.boolean().default(false),
  at: z.string(),
});
const suggestionSchema = z.object({
  id: z.string(),
  facet: z.enum(FACETS),
  text: z.string(),
  why: z.string(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
  at: z.string(),
});
const docSchema = z.object({ lines: z.array(lineSchema).default([]), suggestions: z.array(suggestionSchema).default([]) });

export type SelfLine = z.infer<typeof lineSchema>;
export type SelfSuggestion = z.infer<typeof suggestionSchema>;
export type SelfDoc = z.infer<typeof docSchema>;

export const LINE_MAX = 400;
export const LINES_PER_FACET = 6;

/** Reads whatever is stored; anything malformed is dropped rather than trusted. */
export function parseSelfDoc(raw: unknown): SelfDoc | null {
  if (raw == null) return null;
  const parsed = docSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export type OnboardingAnswers = {
  beliefs?: string | null;
  workStyle?: string | null;
  buildingToward?: string | null;
  strengths?: string | null;
  gaps?: string | null;
  decisionStyle?: string | null;
};

const clean = (s?: string | null) => (s ?? "").trim().replace(/\s+/g, " ");

/** The first version of your Self: your onboarding answers, one line each, unchanged. */
export function selfFromOnboarding(a: OnboardingAnswers, now: string, id: () => string): SelfDoc {
  const rows: [Facet, string][] = [
    ["BELIEVE", clean(a.beliefs)],
    ["DECIDE", clean(a.decisionStyle)],
    ["ENERGY", clean(a.workStyle)],
    ["STRENGTHS", clean(a.strengths) && `Strong at: ${clean(a.strengths)}`],
    ["STRENGTHS", clean(a.gaps) && `Needs others for: ${clean(a.gaps)}`],
    ["TOWARD", clean(a.buildingToward)],
  ];
  return {
    lines: rows.filter(([, t]) => t).map(([facet, text]) => ({ id: id(), facet, text, source: "onboarding", edited: false, at: now })),
    suggestions: [],
  };
}

/** Exactly what your agent is given: every line, grouped by facet, in your words. */
export function renderPersona(name: string, doc: SelfDoc, headline?: string | null): string {
  const first = name.split(" ")[0] || name;
  const parts = [headline?.trim() ? `${first}: ${headline.trim().replace(/\.$/, "")}.` : `${first}.`];
  for (const f of FACETS) {
    const lines = doc.lines.filter((l) => l.facet === f).map((l) => l.text.trim().replace(/\.?$/, "."));
    if (lines.length) parts.push(`${FACET_COPY[f].persona}: ${lines.join(" ")}`);
  }
  return parts.join("\n");
}

export type SelfOp =
  | { type: "add"; facet: Facet; text: string }
  | { type: "edit"; id: string; text: string }
  | { type: "remove"; id: string }
  | { type: "accept"; id: string; text?: string }
  | { type: "reject"; id: string };

export type OpResult = { ok: true; doc: SelfDoc } | { ok: false; message: string };

/** Applies one change. Never mutates the input. */
export function applySelfOp(doc: SelfDoc, op: SelfOp, now: string, id: () => string): OpResult {
  const next: SelfDoc = { lines: [...doc.lines], suggestions: [...doc.suggestions] };
  const tooLong = (t: string) => t.length > LINE_MAX;
  switch (op.type) {
    case "add": {
      const text = clean(op.text);
      if (!text) return { ok: false, message: "Write something first." };
      if (tooLong(text)) return { ok: false, message: "Keep a line short: one or two sentences." };
      if (next.lines.filter((l) => l.facet === op.facet).length >= LINES_PER_FACET) return { ok: false, message: "That's plenty for one section. Edit a line instead." };
      next.lines.push({ id: id(), facet: op.facet, text, source: "you", edited: false, at: now });
      return { ok: true, doc: next };
    }
    case "edit": {
      const i = next.lines.findIndex((l) => l.id === op.id);
      if (i < 0) return { ok: false, message: "That line is gone. Refresh and try again." };
      const text = clean(op.text);
      if (!text) return { ok: false, message: "Write something, or remove the line." };
      if (tooLong(text)) return { ok: false, message: "Keep a line short: one or two sentences." };
      next.lines[i] = { ...next.lines[i]!, text, edited: true, at: now };
      return { ok: true, doc: next };
    }
    case "remove": {
      if (!next.lines.some((l) => l.id === op.id)) return { ok: false, message: "That line is gone. Refresh and try again." };
      next.lines = next.lines.filter((l) => l.id !== op.id);
      return { ok: true, doc: next };
    }
    case "accept":
    case "reject": {
      const i = next.suggestions.findIndex((s) => s.id === op.id && s.status === "PENDING");
      if (i < 0) return { ok: false, message: "That suggestion was already answered." };
      const s = next.suggestions[i]!;
      next.suggestions[i] = { ...s, status: op.type === "accept" ? "ACCEPTED" : "REJECTED", at: now };
      if (op.type === "accept") {
        const text = clean(op.text ?? s.text);
        if (!text || tooLong(text)) return { ok: false, message: "Keep a line short: one or two sentences." };
        next.lines.push({ id: id(), facet: s.facet, text, source: "suggestion", edited: text !== s.text, at: now });
      }
      return { ok: true, doc: next };
    }
  }
}

const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim();

/**
 * Adds new "Is this you?" suggestions, skipping any that repeat a line you
 * already have or one you've already answered (yes or no). At most 3 pending.
 */
export function addSuggestions(doc: SelfDoc, incoming: { facet: Facet; text: string; why: string }[], now: string, id: () => string): SelfDoc {
  const seen = new Set([...doc.lines.map((l) => norm(l.text)), ...doc.suggestions.map((s) => norm(s.text))]);
  const next: SelfDoc = { lines: doc.lines, suggestions: [...doc.suggestions] };
  let pending = next.suggestions.filter((s) => s.status === "PENDING").length;
  for (const s of incoming) {
    const text = clean(s.text);
    if (!text || text.length > LINE_MAX || seen.has(norm(text)) || pending >= 3) continue;
    seen.add(norm(text));
    next.suggestions.push({ id: id(), facet: s.facet, text, why: clean(s.why), status: "PENDING", at: now });
    pending += 1;
  }
  return next;
}
