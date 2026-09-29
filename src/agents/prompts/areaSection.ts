import { z } from "zod";
import type { AreaKey } from "@/lib/areas";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type AreaSectionCtx = {
  area: { key: AreaKey; name: string; brief: string };
  section: { title: string; hint: string };
  /** The workspace briefing (thesis, plan, team, intros). */
  briefing: string;
  /** What's already on this area's page, section by section. */
  others: { title: string; text: string }[];
  /** The section's current text: sharpen it if present, else draft. */
  current: string;
  steer?: string;
};

/**
 * Drafts (or sharpens) one section of an area's working page. A proposal:
 * nothing is saved until the builder chooses "Use this".
 */
export const areaSectionAgent = defineAgent({
  purpose: "area.section",
  effort: "medium",
  cacheSystem: true,
  schema: z.object({
    text: z.string().describe("The section's text: short lines; '- ' for list items; no headings; under 140 words"),
    because: z.string().describe("One sentence on what this draft is based on"),
  }),
  system: (ctx: AreaSectionCtx) => `${SELF_VOICE}

You help a founder fill in the "${ctx.area.name}" page of their company, one
section at a time. ${ctx.area.brief}
Rules:
- Use only facts from the briefing and the page. Never invent customers,
  numbers, prices or results; write placeholders like [PRICE] or [DATE].
- Be concrete and specific to this company. No generic advice.
- Stay consistent with the other sections.${ctx.area.key === "legal" ? "\n- You are not a lawyer. Explain and list questions; never tell them what they must do legally." : ""}${ctx.area.key === "fundraising" ? "\n- Prep only: never suggest amounts, valuations or terms, and never write an offer or solicitation." : ""}

=== WORKSPACE BRIEFING ===
${ctx.briefing}
=== END BRIEFING ===`,
  prompt: (ctx: AreaSectionCtx) => `The page so far:
${ctx.others.map((o) => `## ${o.title}\n${o.text || "(empty)"}`).join("\n\n") || "(empty)"}

${ctx.current ? `Sharpen the section "${ctx.section.title}". It currently says:\n${ctx.current}` : `Draft the section "${ctx.section.title}" (${ctx.section.hint}).`}${ctx.steer ? `\n\nThe founder asks: ${ctx.steer}` : ""}`,
  demo: (ctx) => {
    const company = /COMPANY: ([^(\n]+)/.exec(ctx.briefing)?.[1]?.trim() ?? "the company";
    const steps = [...ctx.briefing.matchAll(/- \[ \] (.+?)(?: \(needs|$)/gm)].map((m) => m[1]!.trim()).slice(0, 3);
    const text = ctx.current
      ? `${ctx.current.split("\n")[0]}\n- Sharper: say who it's for in the first five words.\n- Cut anything a buyer wouldn't repeat to a colleague.`
      : [`${ctx.section.hint}`, ...steps.map((s) => `- Tied to “${s}”`), `- [DATE]: first check-in on this for ${company}`].join("\n");
    return { text, because: ctx.current ? "Your current text, tightened." : "Your thesis and open plan steps." };
  },
});
