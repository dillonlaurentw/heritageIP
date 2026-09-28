import { z } from "zod";

/** Shared (client + server) shape of a saved thesis. */
const field = (label: string) =>
  z.string().trim().min(1, `${label} can't be empty.`).max(1200, "Keep it under 1200 characters.");

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
  { key: "whyUs", label: "Why you", hint: "What you know or can do that others can't." },
  { key: "contrarian", label: "What you believe", hint: "The thing most people would disagree with." },
];
