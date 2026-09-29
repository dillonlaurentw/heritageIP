/**
 * Turns database rows into the plain-text context agents read.
 * Keep this boring and explicit: what the model sees is what's written here.
 */

export type BuilderContext = {
  name: string;
  headline?: string | null;
  beliefs?: string | null;
  workStyle?: string | null;
  buildingToward?: string | null;
  strengths?: string | null;
  gaps?: string | null;
  decisionStyle?: string | null;
  /** Their Self (Self3), rendered from the lines they approved. Preferred over the raw answers. */
  self?: string | null;
};

export function builderBlock(b: BuilderContext) {
  const rows: [string, string | null | undefined][] = [
    ["Name", b.name],
    ["About", b.headline],
    ["Believes (that most people don't)", b.beliefs],
    ["Works best", b.workStyle],
    ["Building toward", b.buildingToward],
    ["Strengths", b.strengths],
    ["Needs others for", b.gaps],
    ["Makes hard calls by", b.decisionStyle],
    ["Their Self, in lines they approved", b.self],
  ];
  return rows
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v!.trim()}`)
    .join("\n");
}

export type ThesisFields = {
  statement: string;
  problem: string;
  audience: string;
  whyNow: string;
  whyUs: string;
  contrarian: string;
};

export function thesisBlock(t: ThesisFields) {
  return [
    `Thesis: ${t.statement}`,
    `Problem: ${t.problem}`,
    `Who it's for: ${t.audience}`,
    `Why now: ${t.whyNow}`,
    `Why this builder: ${t.whyUs}`,
    `Contrarian belief: ${t.contrarian}`,
  ].join("\n");
}

export type QA = { question: string; answer: string };

export function qaBlock(rounds: QA[]) {
  return rounds
    .filter((r) => r.answer.trim())
    .map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer.trim()}`)
    .join("\n\n");
}

/** Shared voice for every SELF agent. */
export const SELF_VOICE = `You are part of SELF, a platform where people take an idea all the way to a real company.
Voice: direct, warm, specific. Short sentences. No jargon, no hype, no emoji, no corporate filler.
Talk to the builder as "you". Push on weak spots honestly; never flatter.`;
