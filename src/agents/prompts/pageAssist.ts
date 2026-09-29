import { z } from "zod";
import type { PageActionKey } from "@/lib/workspace-agents";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type PageAssistCtx = {
  action: PageActionKey;
  /** Free-text instruction ("Draft a hiring post for a designer"). */
  instruction: string;
  pageTitle: string;
  /** The page, as markdown-ish text (bounded). */
  pageText: string;
  /** The selected blocks, as markdown. Empty when nothing is selected. */
  selection: string;
  /** A short workspace briefing, so drafts fit the company. */
  briefing: string;
};

const schema = z.object({
  markdown: z
    .string()
    .describe("The text to insert, in Markdown (paragraphs, '- ' lists, '[ ]' checklists, '##' headings). Empty when the action is 'tasks'."),
  tasks: z
    .array(z.object({ title: z.string().describe("Imperative, under 10 words"), detail: z.string().describe("One sentence of context, or empty") }))
    .max(12)
    .describe("Only for the 'tasks' action: the action items. Empty otherwise."),
  note: z.string().describe("One short line to the person about what you did or what's missing. Empty if nothing to say."),
});
export type PageAssistOutput = z.infer<typeof schema>;

const TASK: Record<PageActionKey, string> = {
  draft: "Write new content for this page, following the instruction. Fit it to the company and the page.",
  rewrite: "Rewrite the selection: clearer and tighter, same meaning, same facts, same structure unless the instruction says otherwise.",
  shorter: "Rewrite the selection at about half the length. Keep every fact that matters.",
  summarize: "Summarise the selection (or the whole page if nothing is selected) in 3-6 bullet points.",
  tasks: "Pull the concrete action items out of the selection (or the whole page). Each is one task someone can do. Put them in `tasks`; leave `markdown` empty.",
  continue: "Continue the page from where it stops, in the same voice and format. Add at most ~150 words.",
};

/** "Ask AI" on a page or selection. Proposes text or tasks; the person accepts or discards. */
export const pageAssistAgent = defineAgent({
  purpose: "page.assist",
  effort: "low",
  schema,
  system: () => `${SELF_VOICE}

You are SELF's writing assistant inside a company workspace (like a doc
editor). You write in the team's voice, plainly. Never invent facts, numbers,
names or quotes that aren't in the page, the selection or the briefing; leave
a clear placeholder like [number] instead. Output Markdown only in the
'markdown' field: no preamble like "Here is".`,
  prompt: (ctx: PageAssistCtx) => `Company briefing (for context only):
${ctx.briefing}

Page: ${ctx.pageTitle || "Untitled"}
--- PAGE ---
${ctx.pageText || "(empty)"}
--- END PAGE ---
${ctx.selection ? `\n--- SELECTION ---\n${ctx.selection}\n--- END SELECTION ---\n` : ""}
Task: ${TASK[ctx.action]}
${ctx.instruction ? `Instruction from the person: ${ctx.instruction}` : ""}`,
  demo: (ctx) => demoAssist(ctx),
});

function demoAssist(ctx: PageAssistCtx): PageAssistOutput {
  const source = (ctx.selection || ctx.pageText).trim();
  const lines = source
    .split(/\n+/)
    .map((l) => l.replace(/^[-*#>\s]+|\[[ x]\]\s*/gi, "").trim())
    .filter((l) => l.length > 3);
  const first = lines[0] ?? ctx.pageTitle ?? "this";
  switch (ctx.action) {
    case "tasks": {
      const verbs = lines.filter((l) => /^(send|book|call|draft|write|ask|price|find|shortlist|set up|get|test|email|plan|check)/i.test(l));
      const picked = (verbs.length ? verbs : lines).slice(0, 5);
      return {
        markdown: "",
        tasks: (picked.length ? picked : ["Decide the next step for this page"]).map((l) => ({ title: l.replace(/[.:]$/, "").slice(0, 80), detail: "" })),
        note: "Demo agent: tasks picked from the lines that read like actions.",
      };
    }
    case "summarize":
      return {
        markdown: lines.slice(0, 4).map((l) => `- ${l.split(/(?<=\.)\s/)[0]}`).join("\n") || "- Nothing to summarise yet.",
        tasks: [],
        note: "Demo agent: a summary built from the first lines.",
      };
    case "rewrite":
    case "shorter": {
      const text = lines.join(" ");
      const words = text.split(/\s+/);
      const out = ctx.action === "shorter" ? words.slice(0, Math.max(8, Math.ceil(words.length / 2))).join(" ").replace(/[,;]?$/, ".") : text;
      return { markdown: out, tasks: [], note: "Demo agent: connect an API key for a real rewrite." };
    }
    case "continue":
      return {
        markdown: `The next question is what would prove this wrong. Before the end of the week, write down the one thing that would change the plan, and who can tell you.`,
        tasks: [],
        note: "Demo agent.",
      };
    default:
      return {
        markdown: `## ${ctx.instruction ? ctx.instruction.replace(/^(draft|write)\s+(an?\s+)?/i, "").replace(/^./, (c) => c.toUpperCase()).slice(0, 60) : "Draft"}\n\nA first pass for **${ctx.pageTitle || "this page"}**, building on "${first.slice(0, 80)}".\n\n- What we know: [fill in]\n- What we're testing: [fill in]\n- What we need from others: [fill in]\n\n[ ] Decide the owner for this`,
        tasks: [],
        note: "Demo agent: placeholders in [brackets] are for you to fill.",
      };
  }
}
