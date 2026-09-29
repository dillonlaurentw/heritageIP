/**
 * A thesis lives as an ordinary page (systemKey "thesis") so people can edit
 * it like any doc. These pure helpers write the fields as blocks and read
 * them back (agents read the page, including the builder's own edits).
 */
import { z } from "zod";
import { B, blocksToText } from "./blocks";

const field = (label: string) => z.string().trim().min(1, `${label} can't be empty.`).max(1200, "Keep it under 1200 characters.");

export const thesisInput = z.object({
  statement: field("The thesis"),
  problem: field("The problem"),
  audience: field("Who it's for"),
  whyNow: field("Why now"),
  whyUs: field("Why you"),
  contrarian: field("What you believe"),
  openQuestions: z.array(z.string().trim().max(300)).max(6),
});
export type ThesisInput = z.infer<typeof thesisInput>;

export const THESIS_FIELDS: { key: Exclude<keyof ThesisInput, "openQuestions" | "statement">; label: string; hint: string }[] = [
  { key: "problem", label: "The problem", hint: "What's broken, for whom, and how badly." },
  { key: "audience", label: "Who it's for", hint: "Specific enough to find them this week." },
  { key: "whyNow", label: "Why now", hint: "What changed that makes this possible or urgent." },
  { key: "whyUs", label: "Why us", hint: "What you know or can do that others can't." },
  { key: "contrarian", label: "What we believe that others don't", hint: "The thing most people would disagree with." },
];
const OPEN = "Open questions";

export function thesisToBlocks(t: ThesisInput) {
  return [
    B.quote(t.statement),
    ...THESIS_FIELDS.flatMap((f) => [B.h2(f.label), B.p(t[f.key])]),
    B.h2(OPEN),
    ...(t.openQuestions.length ? t.openQuestions.map((q) => B.bullet(q)) : [B.p("")]),
  ];
}

type AnyBlock = { type?: string; content?: unknown; children?: unknown[] };

/** Read a thesis back from its page. Missing sections come back empty. */
export function thesisFromBlocks(doc: unknown): ThesisInput {
  const blocks = (Array.isArray(doc) ? doc : []) as AnyBlock[];
  const out: ThesisInput = { statement: "", problem: "", audience: "", whyNow: "", whyUs: "", contrarian: "", openQuestions: [] };
  let section: keyof ThesisInput | null = null;
  const labels = new Map<string, keyof ThesisInput>(THESIS_FIELDS.map((f) => [f.label.toLowerCase(), f.key]));
  labels.set(OPEN.toLowerCase(), "openQuestions");
  for (const b of blocks) {
    const text = blocksToText(b.content).trim();
    if (b.type === "heading") {
      section = labels.get(text.toLowerCase()) ?? null;
      continue;
    }
    if (!text) continue;
    if (!section && !out.statement && (b.type === "quote" || b.type === "paragraph")) {
      out.statement = text;
      continue;
    }
    if (section === "openQuestions") out.openQuestions.push(text);
    else if (section) out[section] = out[section] ? `${out[section]}\n${text}` : text;
  }
  return out;
}

export const hasThesis = (t: ThesisInput) => Boolean(t.statement && t.problem);
