/**
 * Self platform rules: consent, context ranking, learning from outcomes and
 * share grants. Pure and tested (src/lib/__tests__/self-rules.test.ts); the
 * server code in src/lib/self/store.ts only loads rows and applies results.
 */
import { categoryDef, categoryLabel } from "./domains";

export type Stance = "LIKES" | "AVOIDS";
export type Source = "STATED" | "OBSERVED";
export type Purpose = "personalization" | "ai_agent";
export const PURPOSES: Purpose[] = ["personalization", "ai_agent"];

export type Pref = {
  category: string;
  value: string;
  stance: Stance;
  source: Source;
  evidence: number;
  lastEvidenceAt: Date;
  note?: string | null;
};

/** Where a preference came from: this service, or another one with permission. */
export type Origin = { service: string; serviceName: string; shared: boolean };

// ── Consent ──────────────────────────────────────────────────

export type Consent = { personalization: boolean; agents: boolean };

/** Recording anything about a customer needs their personalization consent. */
export function mayRecord(c: Consent): boolean {
  return c.personalization;
}

/** Context for an AI agent needs both: personalization and agents. */
export function mayRetrieve(c: Consent, purpose: Purpose): boolean {
  return purpose === "ai_agent" ? c.personalization && c.agents : c.personalization;
}

export function consentProblem(c: Consent, purpose: Purpose | "record"): string | null {
  if (!c.personalization) return "This customer hasn't allowed personalization, so Self won't record or return anything about them.";
  if (purpose === "ai_agent" && !c.agents) return "This customer hasn't allowed their context to be given to AI agents.";
  return null;
}

// ── Values ───────────────────────────────────────────────────

export function normalizeValue(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
}

const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "they", "them", "their", "some", "any", "want", "wants", "need", "needs",
  "looking", "something", "like", "likes", "new", "good", "best", "find", "show", "help", "about", "from", "into", "what",
  "under", "over", "pair", "item", "items", "recommend", "recommendation",
]);

/** Lowercase words of three letters or more, without common filler, lightly singularized. */
export function tokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().match(/[a-z0-9$]+/g) ?? []) {
    if (raw.length < 3 || STOP.has(raw)) continue;
    const w = raw.length > 4 && raw.endsWith("s") && !raw.endsWith("ss") ? raw.slice(0, -1) : raw;
    if (!out.includes(w)) out.push(w);
  }
  return out;
}

// ── Context ──────────────────────────────────────────────────

export type ContextItem = Pref & { origin: Origin; reasons: string[]; relevance: number };

export type RankInput = {
  query?: string | null;
  prefs: Array<Pref & { origin: Origin }>;
  categories?: string[] | null;
  limit?: number;
};

/**
 * Picks the preferences that matter for this request, with the reason for
 * each in words. A preference counts when its value shares a word with the
 * query, or when its category is the kind of thing the query is about (size
 * for shoes, material for a jacket). With no query, the strongest preferences
 * come back. Avoids sort first among equals: they prevent bad suggestions.
 */
export function rankContext({ query, prefs, categories, limit = 12 }: RankInput): ContextItem[] {
  const q = tokens(query ?? "");
  const filtered = categories?.length ? prefs.filter((p) => categories.includes(p.category)) : prefs;

  const scored: ContextItem[] = filtered.map((p) => {
    const reasons: string[] = [];
    let relevance = 0;
    if (q.length) {
      const vt = tokens(p.value);
      const hits = vt.filter((t) => q.includes(t));
      if (hits.length) {
        relevance += 3 * hits.length;
        reasons.push(`mentions "${hits.join('", "')}"`);
      }
      const cue = categoryDef(p.category)?.cues.find((c) => q.includes(tokens(c)[0] ?? c));
      if (cue) {
        relevance += 1;
        reasons.push(`${categoryLabel(p.category).toLowerCase()} matters for "${cue}"`);
      }
    } else {
      relevance = 1;
      reasons.push("one of their strongest preferences");
    }
    return { ...p, reasons, relevance };
  });

  let picked = scored.filter((s) => s.relevance > 0);
  if (q.length && picked.length === 0) {
    picked = scored.filter((s) => s.source === "STATED").map((s) => ({ ...s, relevance: 1, reasons: ["nothing matched directly; something they told you"] }));
  }

  return picked
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        (a.stance === b.stance ? 0 : a.stance === "AVOIDS" ? -1 : 1) ||
        (a.source === b.source ? 0 : a.source === "STATED" ? -1 : 1) ||
        b.evidence - a.evidence ||
        b.lastEvidenceAt.getTime() - a.lastEvidenceAt.getTime(),
    )
    .slice(0, limit);
}

function basis(p: Pref): string {
  if (p.source === "STATED") return p.evidence > 1 ? `said so ${p.evidence} times` : "said so";
  return p.evidence > 1 ? `learned from ${p.evidence} outcomes` : "learned from 1 outcome";
}

/** One plain line per item, ready to put in an AI agent's prompt. */
export function contextLines(items: ContextItem[]): string[] {
  return items.map((i) => {
    const verb = i.stance === "LIKES" ? "Likes" : "Avoids";
    const from = i.origin.shared ? ` Shared from ${i.origin.serviceName} with the customer's permission.` : "";
    const note = i.note ? ` Note: ${i.note}.` : "";
    return `${verb} ${i.value} (${categoryLabel(i.category).toLowerCase()}; ${basis(i)}).${note}${from}`;
  });
}

// ── Stated preferences ───────────────────────────────────────

export type PrefWrite =
  | { op: "create"; category: string; value: string; stance: Stance; source: Source; evidence: number; note?: string | null }
  | { op: "update"; category: string; value: string; stance: Stance; source: Source; evidence: number; note?: string | null }
  | { op: "delete"; category: string; value: string };

/** What the customer says wins over anything observed. Saying it again adds evidence. */
export function applyStated(existing: Pref | undefined, s: { category: string; value: string; stance: Stance; note?: string | null }): PrefWrite {
  const value = normalizeValue(s.value);
  if (!existing) return { op: "create", category: s.category, value, stance: s.stance, source: "STATED", evidence: 1, note: s.note ?? null };
  const same = existing.stance === s.stance;
  return {
    op: "update",
    category: s.category,
    value,
    stance: s.stance,
    source: "STATED",
    evidence: same ? existing.evidence + 1 : 1,
    note: s.note ?? existing.note ?? null,
  };
}

// ── Learning from outcomes ───────────────────────────────────

export const POSITIVE = ["accepted", "purchased"] as const;
export const NEGATIVE = ["rejected", "returned"] as const;
export const RESULTS = [...POSITIVE, ...NEGATIVE, "ignored"] as const;
export type OutcomeResult = (typeof RESULTS)[number];

export type Attr = { category: string; value: string };

export type Change = {
  category: string;
  value: string;
  stance: Stance;
  change: "added" | "strengthened" | "weakened" | "removed" | "kept";
  why: string;
};

export type Learned = { writes: PrefWrite[]; changes: Change[]; note: string };

/**
 * Turns one outcome into preference changes.
 * - accepted / purchased: each attribute of the item becomes (or strengthens)
 *   an observed like; an observed avoid of the same thing weakens.
 * - rejected / returned: only the attributes named in `because` count. With
 *   no reason, nothing is learned: a return can mean anything.
 * - ignored: recorded, nothing learned.
 * Stated preferences are never changed by an outcome; a conflict is reported.
 */
export function learnFromOutcome(input: { result: OutcomeResult; attributes: Attr[]; because?: Attr[]; existing: Pref[] }): Learned {
  const { result, existing } = input;
  if (result === "ignored") return { writes: [], changes: [], note: "Ignored suggestions are recorded but teach nothing." };

  const positive = (POSITIVE as readonly string[]).includes(result);
  const attrs = dedupe(positive ? input.attributes : (input.because ?? []));
  if (!positive && attrs.length === 0)
    return { writes: [], changes: [], note: `No reason was given for "${result}", so nothing was learned. Pass \`because\` with the attributes that didn't work.` };

  const want: Stance = positive ? "LIKES" : "AVOIDS";
  const writes: PrefWrite[] = [];
  const changes: Change[] = [];

  for (const a of attrs) {
    const value = normalizeValue(a.value);
    const cur = existing.find((p) => p.category === a.category && p.value === value);
    if (!cur) {
      writes.push({ op: "create", category: a.category, value, stance: want, source: "OBSERVED", evidence: 1 });
      changes.push({ category: a.category, value, stance: want, change: "added", why: `${result} an item with this` });
    } else if (cur.stance === want) {
      writes.push({ op: "update", category: a.category, value, stance: want, source: cur.source, evidence: cur.evidence + 1, note: cur.note });
      changes.push({ category: a.category, value, stance: want, change: "strengthened", why: `${result} again` });
    } else if (cur.source === "STATED") {
      changes.push({ category: a.category, value, stance: cur.stance, change: "kept", why: "the customer said otherwise; what they say wins" });
    } else if (cur.evidence <= 1) {
      writes.push({ op: "delete", category: a.category, value });
      changes.push({ category: a.category, value, stance: cur.stance, change: "removed", why: `${result} contradicts the only evidence` });
    } else {
      writes.push({ op: "update", category: a.category, value, stance: cur.stance, source: cur.source, evidence: cur.evidence - 1, note: cur.note });
      changes.push({ category: a.category, value, stance: cur.stance, change: "weakened", why: `${result} contradicts it` });
    }
  }
  const note = changes.length ? `${changes.length} preference${changes.length === 1 ? "" : "s"} updated.` : "Nothing to change.";
  return { writes, changes, note };
}

function dedupe(attrs: Attr[]): Attr[] {
  const seen = new Set<string>();
  return attrs.filter((a) => {
    const k = `${a.category}:${normalizeValue(a.value)}`;
    if (seen.has(k) || !normalizeValue(a.value)) return false;
    seen.add(k);
    return true;
  });
}

// ── Sharing across services ──────────────────────────────────

export type GrantStatus = "PENDING" | "ACTIVE" | "DECLINED" | "REVOKED";

/** The customer can narrow what was asked for, never widen it. */
export function approvedCategories(requested: string[], approved: string[]): string[] {
  return requested.filter((c) => approved.includes(c));
}

export function mayDecide(status: GrantStatus): boolean {
  return status === "PENDING";
}

export function mayRevoke(status: GrantStatus): boolean {
  return status === "PENDING" || status === "ACTIVE";
}

/** A grant contributes context only while active, and only its categories. */
export function sharedPrefs<P extends { category: string }>(grant: { status: GrantStatus; categories: string[] }, prefs: P[]): P[] {
  return grant.status === "ACTIVE" ? prefs.filter((p) => grant.categories.includes(p.category)) : [];
}

/**
 * When two services hold the same thing, the receiving service's own
 * preference wins; shared ones fill gaps and never override.
 */
export function mergeWithShared<P extends { category: string; value: string; origin: Origin }>(own: P[], shared: P[]): P[] {
  const have = new Set(own.map((p) => `${p.category}:${p.value}`));
  return [...own, ...shared.filter((p) => !have.has(`${p.category}:${p.value}`))];
}
