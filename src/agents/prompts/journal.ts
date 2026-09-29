import { z } from "zod";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

export type JournalCtx = {
  /** Their Self, exactly the approved lines (renderPersona). */
  self: string;
  /** Today's journal so far, oldest first. */
  today: { who: "me" | "self"; text: string }[];
  /** A few recent days in their own words, newest first: for noticing patterns. */
  recent: { day: string; text: string }[];
};

/**
 * The founder's daily journal companion. It listens, asks one good question,
 * and helps them land on what they learned, decided and will do next.
 * It sees only this person's own journal and approved Self lines.
 */
export const journalAgent = defineAgent({
  purpose: "journal.reply",
  effort: "low",
  schema: z.object({
    reply: z
      .string()
      .describe("What SELF says back. 1-3 short sentences, at most one question. Plain, warm, specific to what they said. Max 60 words."),
  }),
  system: () => `${SELF_VOICE}

You are the other side of a founder's private daily journal. They talk or
type about their day; you help them think.

- Listen first. Reflect back the one thing that matters most in what they said.
- Ask at most one question, and make it the useful one: what they learned,
  what they'll decide, or what they'll do next. Sometimes ask nothing.
- If something keeps coming back across days, say so gently, once.
- Never give scores, grades, streaks or judgements about them or anyone else.
- Never diagnose, never give legal, medical or financial advice. If they are
  in real distress, say you're glad they wrote it down and suggest talking to
  someone they trust.
- Don't invent facts or numbers. Don't be cheerful for the sake of it.
- This journal is private. Never suggest sharing it; they decide that.`,
  prompt: (ctx: JournalCtx) => `Who they are (their own words):
${ctx.self || "(nothing yet)"}

${ctx.recent.length ? `Recent days:\n${ctx.recent.map((r) => `${r.day}: ${r.text}`).join("\n")}\n\n` : ""}Today so far:
${ctx.today.map((m) => `${m.who === "me" ? "Them" : "You"}: ${m.text}`).join("\n")}`,
  demo: (ctx) => {
    const last = [...ctx.today].reverse().find((m) => m.who === "me")?.text ?? "";
    const pick = (rules: [RegExp, string][], fallback: string) => rules.find(([re]) => re.test(last))?.[1] ?? fallback;
    return {
      reply: pick(
        [
          [/pric|quote|cost/i, "Pricing keeps coming back this week. If you had to send one number tomorrow, what would it be, and what would make you change it?"],
          [/stuck|can't|cannot|worried|quiet|no answer|didn't/i, "That sounds like the part that's actually slowing you down. What's the smallest step on it you could take tomorrow?"],
          [/signed|shipped|launched|yes|won/i, "That's real progress. What made it work, so you can do it again?"],
        ],
        "What did today teach you that you didn't know this morning?",
      ),
    };
  },
});
