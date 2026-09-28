import { z } from "zod";
import { builderBlock, SELF_VOICE, type BuilderContext } from "../context";
import { defineAgent } from "../define";

/**
 * Turns someone's onboarding answers into the persona their personal agent is
 * given. The person reads and can edit the result, so it must be faithful:
 * nothing beyond what they wrote.
 */
export const personaAgent = defineAgent({
  purpose: "persona.build",
  effort: "medium",
  schema: z.object({
    persona: z.string().describe("120-180 words, third person, present tense"),
  }),
  system: () => `${SELF_VOICE}

You write the persona a person's AI stand-in is built from. It is shown to that
person, who can edit it. Be faithful: use only what they wrote. Never add
biography, credentials, opinions or traits they didn't state. Keep their
words where they're vivid. No flattery, no judgement.`,
  prompt: (ctx: { builder: BuilderContext }) => `Here is what this person wrote about themselves:

${builderBlock(ctx.builder)}

Write their persona in 120-180 words, third person, present tense, starting
with their first name. Cover, in this order: what they believe, how they work,
what they're building toward, where they're strong, where they rely on others,
and how they make hard calls and handle disagreement. If something is missing,
leave it out rather than guessing.`,
  demo: (ctx) => ({ persona: defaultPersona(ctx.builder) }),
});

/**
 * The persona used when someone hasn't written or generated one: a plain,
 * deterministic restatement of their own answers. No AI, no guessing.
 */
export function defaultPersona(b: BuilderContext) {
  const first = b.name.split(" ")[0];
  const line = (label: string, v?: string | null) => (v?.trim() ? `${label} ${v.trim().replace(/\.?$/, ".")}` : null);
  return [
    b.headline ? `${first}: ${b.headline}.` : `${first}.`,
    line("Believes:", b.beliefs),
    line("Works best:", b.workStyle),
    line("Building toward:", b.buildingToward),
    line("Strongest at:", b.strengths),
    line("Relies on others for:", b.gaps),
    line("Hard calls and disagreement:", b.decisionStyle),
  ]
    .filter(Boolean)
    .join(" ");
}
