import { z } from "zod";
import { builderBlock, qaBlock, SELF_VOICE, thesisBlock, type BuilderContext, type QA, type ThesisFields } from "../context";
import { defineAgent } from "../define";

export type ThesisCtx = {
  builder: BuilderContext;
  companyName: string;
  rawIdea: string;
  /** Answers so far, across rounds. */
  qa: QA[];
  /** Present when sharpening an existing thesis. */
  current?: ThesisFields | null;
  round: number;
  maxRounds: number;
};

const SYSTEM = `${SELF_VOICE}

You are SELF's thesis agent. You help a builder turn a raw idea into a core
thesis: the problem, who it's for, why now, why them, and what they believe
that others don't. You ask the questions a sharp co-founder would ask, one
idea at a time. You never invent facts about the builder; if something is
unknown, ask or leave it as an open question.`;

function situation(ctx: ThesisCtx) {
  return [
    `Company: ${ctx.companyName}`,
    `Raw idea, in the builder's words:\n"""${ctx.rawIdea}"""`,
    ctx.current ? `Current thesis:\n${thesisBlock(ctx.current)}` : null,
    ctx.qa.length ? `Questions answered so far:\n${qaBlock(ctx.qa)}` : null,
    `About the builder:\n${builderBlock(ctx.builder)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Step 1 (and each further round): the hard questions. */
export const thesisQuestionsAgent = defineAgent({
  purpose: "thesis.questions",
  effort: "medium",
  schema: z.object({
    reflection: z.string().describe("One or two sentences playing back what you heard, sharpened"),
    questions: z.array(z.string()).describe("Exactly 3 questions, each under 25 words"),
  }),
  system: () => SYSTEM,
  prompt: (ctx: ThesisCtx) => `${situation(ctx)}

This is question round ${ctx.round} of ${ctx.maxRounds}.
Play back the idea in one or two sharper sentences, then ask exactly 3
questions that would most change the thesis if answered. Target the weakest
parts first (usually: who exactly it's for, and why now). Don't repeat
questions already answered.`,
  demo: (ctx) => {
    // Demo mode has no model, so each round gets its own fixed set of questions.
    const rounds = [
      {
        reflection: `So: ${ctx.rawIdea.split(/[.!?]/)[0].trim()}. The interesting part is who feels this problem hardest, and why nobody has fixed it yet.`,
        questions: [
          "Who is the first person who would pay for this, and what are they using today instead?",
          "What changed in the last two years that makes this possible or urgent now?",
          "What do you know about this problem that someone smart but new to it wouldn't?",
        ],
      },
      {
        reflection: "The draft is closer. The weak spots are how you reach the first customers and what makes this hard to copy.",
        questions: [
          "How will your first twenty customers hear about you?",
          "If a bigger company copied this next year, what would they still get wrong?",
          "What would have to be true for this to be a bad idea?",
        ],
      },
      {
        reflection: "You know who it's for and why now. What's left is proof: what someone will pay, and what you'd see first if it works.",
        questions: [
          "What would a first customer pay, and how would you find out this month?",
          "What's the smallest version you could put in someone's hands in two weeks?",
          "What result in the first ninety days would tell you to keep going?",
        ],
      },
    ];
    return rounds[Math.min(ctx.round, rounds.length) - 1];
  },
});

const thesisShape = z.object({
  statement: z.string().describe("The whole bet in one or two sentences"),
  problem: z.string(),
  audience: z.string().describe("Who it's for, specifically"),
  whyNow: z.string(),
  whyUs: z.string().describe("Why this builder, drawn from their profile and answers"),
  contrarian: z.string().describe("What they believe that most people don't"),
  openQuestions: z.array(z.string()).describe("2-3 things still weak or unproven, as short questions"),
});

/** Step 2: draft (or redraft) the thesis. */
export const thesisDraftAgent = defineAgent({
  purpose: "thesis.draft",
  effort: "high",
  schema: thesisShape,
  system: () => SYSTEM,
  prompt: (ctx: ThesisCtx) => `${situation(ctx)}

Draft the core thesis now. Use the builder's own words where they are strong.
Each field is 1-3 sentences, concrete, no hedging. "whyUs" must come from what
the builder actually wrote. List what's still weak as open questions rather
than papering over it.`,
  demo: (ctx) => {
    const a = (i: number) => ctx.qa[i]?.answer?.trim() || undefined;
    return {
      statement: `${ctx.companyName} exists because ${ctx.rawIdea.split(/[.!?]/)[0].trim().toLowerCase()}, and the people who feel it most have been ignored.`,
      problem: ctx.rawIdea.trim(),
      audience: a(0) ?? "A specific first customer you can name and reach this month.",
      whyNow: a(1) ?? "Costs have dropped and habits have shifted enough that this is newly possible.",
      whyUs:
        a(2) ??
        (ctx.builder.strengths
          ? `You bring ${ctx.builder.strengths.charAt(0).toLowerCase()}${ctx.builder.strengths.slice(1)}`
          : "You've lived this problem."),
      contrarian:
        ctx.builder.beliefs ?? "Most people think this market is too small. You think it's underserved, not small.",
      openQuestions: [
        "How will the first twenty customers find you?",
        "What does it cost to serve one customer, and what will they pay?",
      ],
    };
  },
});
