import { z } from "zod";
import { FACETS, FACET_COPY, type Facet } from "@/lib/self-doc";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type SelfSuggestCtx = {
  name: string;
  /** Their Self as it stands: "[BELIEVE] line". */
  lines: { facet: Facet; text: string }[];
  /** Things they said or did on SELF, each with where it came from. */
  evidence: { source: string; text: string }[];
  /** Suggestions they already answered, so we don't repeat them. */
  answered: string[];
};

/**
 * Proposes "Is this you?" lines for someone's Self from what they actually
 * said and did on SELF. Proposals only: the person says yes or no to each.
 */
export const selfSuggestAgent = defineAgent({
  purpose: "self.suggest",
  effort: "medium",
  schema: z.object({
    suggestions: z
      .array(
        z.object({
          facet: z.enum(FACETS),
          text: z.string().describe("One sentence in second person ('You…') or their own words. Max 160 characters."),
          why: z.string().describe("Where this comes from, citing the evidence plainly. Max 140 characters."),
        }),
      )
      .max(3),
  }),
  system: () => `${SELF_VOICE}

You help keep someone's "Self" honest: a few short lines about what they
believe, why they build, how they decide, what gives and drains their energy,
where they're strong and where they need others, their non-negotiables, and
what they're building toward. Their AI stand-in is built from these lines.

Suggest at most three NEW lines, each backed by the evidence you're given.
Rules:
- Only what the evidence shows. Never guess at personality, background,
  health, family, politics, religion or anything sensitive.
- No flattery, no judgement, no labels ("visionary", "risk-averse").
- Don't repeat or reword a line they already have, or one they already answered.
- If the evidence doesn't support anything new, return no suggestions.`,
  prompt: (ctx: SelfSuggestCtx) => `Person: ${ctx.name}

Their Self now:
${ctx.lines.map((l) => `- [${FACET_COPY[l.facet].label}] ${l.text}`).join("\n") || "(empty)"}

Already answered, don't repeat:
${ctx.answered.map((a) => `- ${a}`).join("\n") || "(none)"}

Evidence from their time on SELF:
${ctx.evidence.map((e) => `- (${e.source}) ${e.text}`).join("\n") || "(none)"}

Suggest up to three new lines, each with where it comes from.`,
  demo: (ctx) => {
    const have = new Set([...ctx.lines.map((l) => l.text.toLowerCase()), ...ctx.answered.map((a) => a.toLowerCase())]);
    const out: { facet: Facet; text: string; why: string }[] = [];
    for (const e of ctx.evidence) {
      if (out.length >= 2) break;
      const m = /^Contrarian belief: (.+)$/.exec(e.text);
      if (m && !have.has(m[1]!.toLowerCase())) out.push({ facet: "BELIEVE", text: m[1]!, why: `You wrote this in ${e.source}.` });
      const w = /^Why this builder: (.+)$/.exec(e.text);
      if (w && !ctx.lines.some((l) => l.facet === "STRENGTHS")) out.push({ facet: "STRENGTHS", text: `Strong at: ${w[1]}`, why: `From “why you” in ${e.source}.` });
    }
    return { suggestions: out };
  },
});
