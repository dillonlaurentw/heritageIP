import { z } from "zod";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type MatchCtx = {
  company: { name: string; oneLiner: string | null; thesis: string | null };
  chair: { title: string; kind: "cofounder" | "advisor"; detail: string | null };
  /** The founder's Self (approved lines) or their answers. */
  founder: { name: string; self: string };
  /** Only what this person agreed founders may see. */
  person: {
    name: string;
    headline: string | null;
    location: string | null;
    strengths: string | null;
    buildingToward: string | null;
    note: string | null;
    focusAreas: string[];
  };
};

/**
 * Explains, in words, where someone might fit an open chair. A conversation
 * starter for the founder, never a score, rank or verdict on the person.
 */
export const matchAgent = defineAgent({
  purpose: "match.explain",
  effort: "low",
  schema: z.object({
    fit: z.array(z.string()).min(1).max(3).describe("2-3 sentences, each tying something the founder needs to something the person said"),
    askAbout: z.array(z.string()).min(1).max(2).describe("Questions worth asking in a first conversation, under 20 words each"),
  }),
  system: () => `${SELF_VOICE}

You explain to a founder where another person on SELF might fit an open
chair in their company. You write for the founder ("you").
Rules:
- Ground every sentence in the text given: what the founder needs and what
  the person said about themselves. Never invent experience or traits.
- No scores, numbers about fit, rankings, "perfect match", or verdicts.
- Say plainly where something is unknown; that's what the questions are for.
- Never comment on age, gender, nationality, health, family or anything personal.`,
  prompt: (ctx: MatchCtx) => `Company: ${ctx.company.name}${ctx.company.oneLiner ? ` (${ctx.company.oneLiner})` : ""}
${ctx.company.thesis ? `Thesis: ${ctx.company.thesis}\n` : ""}
The open chair: ${ctx.chair.title} (${ctx.chair.kind === "advisor" ? "an advisor or mentor" : "a co-founder or early teammate"})${ctx.chair.detail ? `\nAbout it: ${ctx.chair.detail}` : ""}

The founder, ${ctx.founder.name}:
${ctx.founder.self || "(nothing written yet)"}

The person, ${ctx.person.name}:
${[
  ctx.person.headline && `About: ${ctx.person.headline}`,
  ctx.person.location && `Based in: ${ctx.person.location}`,
  ctx.person.strengths && `Strong at: ${ctx.person.strengths}`,
  ctx.person.buildingToward && `Building toward: ${ctx.person.buildingToward}`,
  ctx.person.focusAreas.length ? `Focus: ${ctx.person.focusAreas.join(", ")}` : null,
  ctx.person.note && `In their words: ${ctx.person.note}`,
]
  .filter(Boolean)
  .join("\n")}

Explain where they might fit, then what to ask first.`,
  demo: (ctx) => {
    const first = ctx.person.name.split(" ")[0];
    const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1).replace(/\.$/, "");
    const fit = [
      `You're looking for ${lower(ctx.chair.title)}${ctx.person.strengths ? `, and ${first} says they're strong at ${lower(ctx.person.strengths)}.` : "."}`,
      ctx.person.buildingToward ? `${first} is building toward ${lower(ctx.person.buildingToward)}, which is worth comparing with where you want ${ctx.company.name} to go.` : null,
      ctx.person.note ? `In their words: “${ctx.person.note}”` : null,
    ].filter((x): x is string => !!x);
    return {
      fit,
      askAbout: ["What would a first month together look like for you?", "How do you like to settle a disagreement?"],
    };
  },
});
