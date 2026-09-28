import { z } from "zod";
import { builderBlock, SELF_VOICE, type BuilderContext } from "../context";
import { defineAgent } from "../define";

/** "Start from nothing": ideas generated from who the builder is. */
export const ideasAgent = defineAgent({
  purpose: "ideas.fromProfile",
  effort: "medium",
  schema: z.object({
    ideas: z.array(
      z.object({
        name: z.string().describe("Working name, 1-3 words"),
        oneLiner: z.string().describe("What it is, under 15 words"),
        whyYou: z.string().describe("Why this builder specifically, one sentence"),
        seed: z.string().describe("The raw idea in 2-3 sentences, written as the builder might say it"),
      }),
    ),
  }),
  system: () => `${SELF_VOICE}

You help builders find an idea worth their next few years. Ideas must come from
the builder's own beliefs, strengths and what they're building toward, not from
trends. Prefer specific, unglamorous problems they are unusually placed to solve.`,
  prompt: (ctx: { builder: BuilderContext; steer?: string }) => `Here is the builder:

${builderBlock(ctx.builder)}
${ctx.steer ? `\nThey added: "${ctx.steer}"\n` : ""}
Give exactly 4 distinct company ideas for this person. Make each one clearly
different in customer or model. Tie "whyYou" to something they actually wrote.`,
  demo: (ctx) => ({
    ideas: [
      {
        name: "Second Shift",
        oneLiner: "Meal subscriptions built around night-shift schedules.",
        whyYou: `${ctx.builder.name.split(" ")[0]}, you wrote about working best in irregular bursts. So do your customers.`,
        seed: "Night workers eat badly because nothing is open when they're hungry. A kitchen that cooks on their clock, delivered before the shift starts.",
      },
      {
        name: "Fixwell",
        oneLiner: "Repair-first spare parts for tools people already own.",
        whyYou: "You said people come to you to make things run on time. Repair is a logistics problem.",
        seed: "Everything breaks, and almost nothing is sold with parts. A parts catalogue and repair guides for the ten most-owned tools.",
      },
      {
        name: "Plotline",
        oneLiner: "Shared tools for community gardens to track what they grow.",
        whyYou: "You believe small groups do better with a shared board everyone can see.",
        seed: "Community gardens run on WhatsApp and memory. A simple board for plots, harvests and who's watering, that cities can fund.",
      },
      {
        name: "Handover",
        oneLiner: "Checklists that make shift changes safe in small clinics.",
        whyYou: "You named calm under pressure as a strength. This is a product for the worst ten minutes of a shift.",
        seed: "Most mistakes in small clinics happen at handover. A two-minute structured handover that fits on a phone.",
      },
    ],
  }),
});
