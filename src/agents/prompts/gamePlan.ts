import { z } from "zod";
import { builderBlock, SELF_VOICE, thesisBlock, type BuilderContext, type ThesisFields } from "../context";
import { defineAgent } from "../define";

const STAGE = z.enum(["VALIDATE", "SETUP", "BUILD", "LAUNCH"]);
const NEED = z.enum(["COFOUNDER", "SUPPLIER", "LEGAL", "FUNDING", "MARKETING", "GTM", "WEBSITE", "MENTOR"]);

const planSchema = z.object({
  steps: z.array(
    z.object({
      stage: STAGE,
      title: z.string().describe("Imperative, under 10 words, e.g. 'Interview 15 seafood processors'"),
      detail: z.string().describe("1-2 sentences: what done looks like, concretely"),
      needs: z.array(NEED).describe("What this step needs from other people. Empty if the builder can do it alone."),
    }),
  ),
});

export type GamePlanCtx = {
  builder: BuilderContext;
  hubName: string;
  thesis: ThesisFields;
  /** Steps already done; the plan should build on them, not repeat them. */
  done: string[];
};

/** From thesis to a staged game plan, each step tagged with what it needs. */
export const gamePlanAgent = defineAgent({
  purpose: "plan.generate",
  effort: "high",
  schema: planSchema,
  system: () => `${SELF_VOICE}

You are SELF's game-plan agent. You turn a core thesis into the concrete steps
from idea to launch, in four stages:
- VALIDATE: prove the problem and the customer (interviews, tests, pre-sales)
- SETUP: company formation, co-founders, money, paperwork
- BUILD: the first real version of the product or service
- LAUNCH: getting it in front of the first customers

Tag each step with what it needs from other people:
COFOUNDER (a co-founder or key early teammate), SUPPLIER (manufacturing or
sourcing), LEGAL (formation, contracts, IP, compliance), FUNDING (backers or
grants), MARKETING (brand, content), GTM (sales, distribution, channels),
WEBSITE (a site or software built), MENTOR (advice from someone experienced).
Only tag real needs. Lean on the builder's stated gaps.`,
  prompt: (ctx: GamePlanCtx) => `Hub: ${ctx.hubName}

${thesisBlock(ctx.thesis)}

About the builder:
${builderBlock(ctx.builder)}
${ctx.done.length ? `\nAlready done (don't repeat these):\n${ctx.done.map((d) => `- ${d}`).join("\n")}\n` : ""}
Write the game plan: 10 to 14 steps across all four stages, in the order
they should happen. Make every step specific to this business and this
builder. No generic advice like "do market research".`,
  demo: (ctx): z.infer<typeof planSchema> => {
    const who = ctx.thesis.audience.split(/[.,;]/)[0].trim();
    return {
      steps: [
        { stage: "VALIDATE", title: "Interview 15 potential customers", detail: `Talk to ${who}. Done when you can describe their current workaround in their words.`, needs: [] },
        { stage: "VALIDATE", title: "Test the riskiest assumption", detail: `Your open question: ${ctx.thesis.problem.split(".")[0]}. Design a one-week test that could prove you wrong.`, needs: ["MENTOR"] },
        { stage: "VALIDATE", title: "Get three letters of intent", detail: "Three customers say in writing they'd pay if it existed. Not likes. Commitments.", needs: [] },
        { stage: "SETUP", title: "Find a co-founder for your gaps", detail: ctx.builder.gaps ? `You said you need others for: ${ctx.builder.gaps}` : "Someone who covers what you don't.", needs: ["COFOUNDER"] },
        { stage: "SETUP", title: "Form the company and split equity", detail: "Pick the structure, file it, and agree vesting before anyone writes code.", needs: ["LEGAL"] },
        { stage: "SETUP", title: "Decide how to fund the first year", detail: "Grants, pre-sales, savings or backers. Pick one path and a monthly burn you can live with.", needs: ["FUNDING"] },
        { stage: "BUILD", title: "Source the first production run", detail: "Two quotes, one sample, one small order you can afford to lose.", needs: ["SUPPLIER"] },
        { stage: "BUILD", title: "Build the smallest version that works", detail: "The embarrassing, specific version for your first three customers.", needs: ["WEBSITE"] },
        { stage: "BUILD", title: "Run a paid pilot with one customer", detail: "They pay something, you learn everything. Write down what broke.", needs: [] },
        { stage: "LAUNCH", title: "Nail the one-line positioning", detail: `Why ${ctx.hubName}, for whom, instead of what. Test it on ten strangers.`, needs: ["MARKETING"] },
        { stage: "LAUNCH", title: "Open the first sales channel", detail: "One channel you can reach this month. Twenty conversations, five customers.", needs: ["GTM"] },
        { stage: "LAUNCH", title: "Launch to the first twenty customers", detail: "Small, loud, personal. Every customer hears from you directly.", needs: ["MARKETING", "GTM"] },
      ],
    };
  },
});
