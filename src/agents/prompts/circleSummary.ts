import { z } from "zod";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type CircleSummaryCtx = {
  circleName: string;
  messages: { name: string; text: string }[];
};

/**
 * "Catch me up": a circle's week of chat in a few lines, plus who could help
 * whom. It points people at each other; it never ranks, grades or judges.
 */
export const circleSummaryAgent = defineAgent({
  purpose: "circle.summary",
  effort: "low",
  schema: z.object({
    summary: z.string().describe("3-4 short sentences: what people in the circle talked about and got done this week. Warm, plain, no ranking."),
    helps: z
      .array(z.object({ from: z.string().describe("First name of who could help"), to: z.string().describe("First name of who needs it"), why: z.string().describe("One sentence, grounded in what they wrote") }))
      .max(3),
  }),
  system: () => `${SELF_VOICE}

You catch someone up on a week of messages in a small group of founders.
Use only what they wrote. Never rank, grade or compare people, never say who
did "best" or "worst", and never guess at anything personal. Point out where
one person's experience could help with what another is stuck on.`,
  prompt: (ctx: CircleSummaryCtx) => `Circle: ${ctx.circleName}

This week's messages:
${ctx.messages.map((m) => `${m.name}: ${m.text}`).join("\n")}`,
  demo: (ctx) => {
    const first = (n: string) => n.split(" ")[0]!;
    const names = [...new Set(ctx.messages.map((m) => first(m.name)))];
    const helps = names.length >= 2 ? [{ from: names[1]!, to: names[0]!, why: `${names[1]} has been working through something close to what ${names[0]} brought up.` }] : [];
    return {
      summary: `${names.join(", ")} talked this week. Most of it was about moving one real thing forward, and the hard parts are about people more than product.`,
      helps,
    };
  },
});
