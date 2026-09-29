import { z } from "zod";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type CircleSummaryCtx = {
  circleName: string;
  checkIns: { name: string; did: string; stuck: string; need: string }[];
};

/**
 * A circle's week in a few lines, plus who could help whom. It points
 * people at each other; it never ranks, grades or judges anyone.
 */
export const circleSummaryAgent = defineAgent({
  purpose: "circle.summary",
  effort: "low",
  schema: z.object({
    summary: z.string().describe("3-4 short sentences: what the circle got done and the common thread. Warm, plain, no ranking."),
    helps: z
      .array(z.object({ from: z.string().describe("First name of who could help"), to: z.string().describe("First name of who needs it"), why: z.string().describe("One sentence, grounded in what they wrote") }))
      .max(3),
  }),
  system: () => `${SELF_VOICE}

You write the weekly note for a small circle of founders who check in with
each other. Use only what they wrote. Never rank, grade or compare people,
never say who did "best" or "worst", and never guess at anything personal.
Point out where one person's experience could help another's stuck point.`,
  prompt: (ctx: CircleSummaryCtx) => `Circle: ${ctx.circleName}

This week's check-ins:
${ctx.checkIns.map((c) => `${c.name}\n  Did: ${c.did}\n  Stuck: ${c.stuck}\n  Needs: ${c.need}`).join("\n\n")}`,
  demo: (ctx) => {
    const first = (n: string) => n.split(" ")[0]!;
    const names = ctx.checkIns.map((c) => first(c.name));
    const helps = ctx.checkIns.length >= 2 ? [{ from: names[1]!, to: names[0]!, why: `${names[1]} has been working through something close to what ${names[0]} is stuck on.` }] : [];
    return {
      summary: `${names.join(", ")} checked in this week. Most of you moved one real thing forward, and the stuck points are about people more than product. Worth a reply or two before Friday.`,
      helps,
    };
  },
});
