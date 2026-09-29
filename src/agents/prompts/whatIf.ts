import { z } from "zod";
import { NEED_TAGS } from "@/lib/needs";
import { THEMES } from "@/lib/ring";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type WhatIfCtx = {
  briefing: string;
  /** Unfinished plan steps, numbered so the answer can point at them. */
  steps: { n: number; title: string; stage: string | null; needs: string[] }[];
  scenario: string;
};

export const whatIfSchema = z.object({
  summary: z.string().describe("Two sentences: what this would mean for the company"),
  slips: z
    .array(z.object({ step: z.number().int().describe("The step's number from the list"), effect: z.string().describe("What happens to it, under 12 words. Use [WEEKS] or [DATE] for time") }))
    .max(6),
  themes: z
    .array(z.object({ theme: z.enum(THEMES), note: z.string().describe("Who this touches in that part of the ring, one line") }))
    .max(4),
  money: z.string().describe("What it means for money, in words only. No invented figures; use placeholders like [AMOUNT]"),
  changes: z
    .array(
      z.object({
        title: z.string().describe("A new plan step, imperative, under 10 words"),
        detail: z.string().describe("Why, in one sentence"),
        stage: z.enum(["VALIDATE", "SETUP", "BUILD", "LAUNCH"]),
        needs: z.array(z.enum(NEED_TAGS)),
      }),
    )
    .max(4),
});
export type WhatIfOutput = z.infer<typeof whatIfSchema>;

/**
 * Business what-if: something that might happen, checked against the plan.
 * A check, not a forecast. Suggested changes are only added when the founder picks them.
 */
export const whatIfAgent = defineAgent({
  purpose: "plan.whatif",
  effort: "high",
  cacheSystem: true,
  schema: whatIfSchema,
  system: (ctx: WhatIfCtx) => `${SELF_VOICE}

You check "what if" scenarios against a young company's plan. Say which
steps would slip and how, which kinds of people it touches (co-founders,
partners, advisors, capital), what it means for money in words, and a few
concrete steps that would soften it.
Rules:
- Use only the briefing and plan below. Never invent numbers, dates, prices
  or amounts; write placeholders like [WEEKS], [DATE] or [AMOUNT].
- This is a check, not a forecast. Be plain about what's uncertain.
- Nothing about investing or raising money beyond talking to people; never
  suggest amounts, valuations or terms.

=== WORKSPACE BRIEFING ===
${ctx.briefing}
=== END BRIEFING ===`,
  prompt: (ctx: WhatIfCtx) => `The unfinished plan steps:
${ctx.steps.map((s) => `${s.n}. ${s.title}${s.stage ? ` [${s.stage}]` : ""}${s.needs.length ? ` (needs ${s.needs.join(", ")})` : ""}`).join("\n") || "(no plan yet)"}

What if: ${ctx.scenario}`,
  demo: (ctx) => {
    const hit = ctx.steps.filter((s) => /press|supplier|sample|pilot|certif|build|production/i.test(s.title)).slice(0, 3);
    const slips = (hit.length ? hit : ctx.steps.slice(0, 2)).map((s, i) => ({ step: s.n, effect: i === 0 ? "Slips by [WEEKS]" : "Waits on the step before it" }));
    return {
      summary: `If ${ctx.scenario.replace(/\.$/, "").replace(/^\w/, (c) => c.toLowerCase())}, the steps that depend on it move, and the ones after them follow. It's worth deciding now what you'd do, while it's cheap.`,
      slips,
      themes: [
        { theme: "PARTNERS" as const, note: "The partners on the delayed steps; a backup would help." },
        { theme: "ADVISORS" as const, note: "Worth telling your advisor early." },
      ],
      money: "Costs keep running while the steps wait, so your runway gets shorter by the delay: about [AMOUNT] a month.",
      changes: [
        { title: "Line up a backup before you need it", detail: "So one delay doesn't stop the plan.", stage: "BUILD" as const, needs: ["SUPPLIER" as const] },
        { title: "Split the pilot into two smaller steps", detail: "Start with what doesn't depend on the delayed step.", stage: "LAUNCH" as const, needs: [] },
      ],
    };
  },
});
