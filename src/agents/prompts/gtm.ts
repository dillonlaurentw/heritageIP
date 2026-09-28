import { z } from "zod";
import { builderBlock, SELF_VOICE, thesisBlock, type BuilderContext, type ThesisFields } from "../context";
import { defineAgent } from "../define";
import { GTM_COPY, GTM_SECTIONS, type GtmSection } from "@/lib/gtm-sections";

export type GtmCtx = {
  builder: BuilderContext;
  hubName: string;
  thesis: ThesisFields;
  section: GtmSection;
  mode: "draft" | "sharpen";
  /** Current content of every section (so the draft stays consistent). */
  workspace: Partial<Record<GtmSection, string | null>>;
  /** Open plan steps tagged MARKETING or GTM. */
  gtmSteps: string[];
};

/** Drafts or sharpens one section of a hub's go-to-market workspace. */
export const gtmAgent = defineAgent({
  purpose: "gtm.section",
  effort: "high",
  schema: z.object({
    content: z.string().describe("The section text. Plain text with line breaks; no markdown headings (#) or bold."),
    rationale: z.string().describe("One sentence: the key choice you made and why"),
  }),
  system: () => `${SELF_VOICE}

You are SELF's go-to-market agent. You help builders get their first twenty
customers, not their first million. Be specific to this business: name real
kinds of places, people and events. Prefer cheap, direct, testable moves.
Never invent traction, customers or numbers the builder hasn't given you;
where a number is needed, frame it as a target.`,
  prompt: (ctx: GtmCtx) => {
    const others = GTM_SECTIONS.filter((s) => s !== ctx.section && ctx.workspace[s]?.trim())
      .map((s) => `${GTM_COPY[s].label}:\n${ctx.workspace[s]!.trim()}`)
      .join("\n\n");
    const current = ctx.workspace[ctx.section]?.trim();
    return `Hub: ${ctx.hubName}

${thesisBlock(ctx.thesis)}

About the builder:
${builderBlock(ctx.builder)}
${ctx.gtmSteps.length ? `\nGo-to-market steps in their game plan:\n${ctx.gtmSteps.map((s) => `- ${s}`).join("\n")}\n` : ""}${others ? `\nOther sections of their workspace (stay consistent with these):\n\n${others}\n` : ""}
Section: ${GTM_COPY[ctx.section].label}
${ctx.mode === "sharpen" && current ? `Their current draft:\n"""${current}"""\n\nSharpen it: keep what's specific and true, cut what's vague, fix what's weak. Keep their voice.` : "Write a first draft."}

Format: ${GTM_COPY[ctx.section].guide}`;
  },
  demo: (ctx) => {
    const who = ctx.thesis.audience.split(/[.;]/)[0].trim();
    const name = ctx.hubName;
    const content: Record<GtmSection, string> = {
      positioning: `For ${who.charAt(0).toLowerCase()}${who.slice(1)} who ${ctx.thesis.problem.split(/[.;]/)[0].trim().toLowerCase()}, ${name} is the first option built around how they actually work. Unlike what they use today, it ${ctx.thesis.contrarian.split(/[.;]/)[0].trim().toLowerCase()}.\nTagline: ${name}. Built for the people everyone else forgot.\n- ${ctx.thesis.whyNow.split(/[.;]/)[0].trim()}\n- ${ctx.thesis.whyUs.split(/[.;]/)[0].trim()}`,
      customers: `Early adopters\n- Who: ${who}\n- Where to find them: the groups, events and suppliers they already rely on\n- Trigger: the week the current workaround fails them again\n- First 20: warm intros from people you interviewed, then referrals\n\nSecond wave\n- Who: the teams and buyers around them who feel the cost\n- Where to find them: trade associations and buyer meetings\n- Trigger: new rules or budgets landing\n- First 20: case study from the pilot`,
      channels: `1. Direct outreach · you already know these people · 20 conversations in two weeks, target 5 pilots\n2. Partner referrals · suppliers and advisors see the pain first · ask 5 partners for 2 intros each\n3. Trade events · buyers gather in one room · one event, 10 qualified conversations\n4. Founder content · your story is the moat · 4 posts in a month, target 3 inbound leads`,
      launchPlan: `Before (weeks -4 to -1)\n- Lock positioning and a one-page site\n- Line up 5 pilot customers to launch with you\n- Prepare a short case study from the pilot\n\nLaunch week\n- Announce with your pilot customers, not alone\n- Personal note to every person you interviewed\n- One event or trade appearance\n\nAfter (weeks +1 to +4)\n- Weekly call with every early customer\n- Turn the best result into a case study\n- Ask each customer for two intros`,
    };
    return {
      content: content[ctx.section],
      rationale:
        ctx.mode === "sharpen"
          ? "Kept your specifics, cut the vague lines, and tied it back to your thesis."
          : "Started from the customer in your thesis and the steps already in your game plan.",
    };
  },
});
