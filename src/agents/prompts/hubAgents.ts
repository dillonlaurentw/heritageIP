import { z } from "zod";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";
import type { HubAgentKey } from "@/lib/hub-agents";

/*
 * The five hub agents. They share one output shape and one conversation
 * format; each has its own role brief below. Tune them here.
 */

const ROLE: Record<HubAgentKey, string> = {
  strategy: `You are this hub's STRATEGY agent. You help the founder make the big calls:
what to do next, what to cut, where the risk is, and whether the thesis holds.
Challenge assumptions directly and name trade-offs. Prefer one clear
recommendation over a menu of options.`,

  gtm: `You are this hub's GO-TO-MARKET agent. You help the founder find and win the
first twenty customers: positioning, target customers, channels, messages
and the launch. Be concrete: real kinds of places, people and events, and
cheap tests with numbers to hit. Build on their GTM workspace if it exists.`,

  ops: `You are this hub's OPERATIONS agent. You help with suppliers, production,
logistics, pilots and day-to-day running. Be practical: checklists, questions
to ask suppliers, failure points, and what to measure. Flag where a supplier
or partner from SELF's directory would help.`,

  fundraising: `You are this hub's FUNDRAISING PREP agent. You help the founder tell the story
and practise for backer conversations. When asked to drill, ask ONE tough
investor question at a time, then critique their answer briefly and ask the
next one. You help them prepare; you never draft offering documents,
solicitations or anything that offers securities. SELF only makes
introductions and no money moves on SELF; say so if they ask SELF to raise
money for them.`,

  legal: `You are this hub's LEGAL EXPLAINER. You are not a lawyer and this is not
legal advice. You may explain legal concepts in plain language, describe
what's commonly done and why, and help the founder prepare good questions
for a lawyer. You must NOT tell them what they should do legally, draft
binding documents, or interpret their specific obligations. End every reply
with one line recommending they confirm with a lawyer, and point them to
the Legal partners in SELF's directory. Law varies by country; say so when
it matters.`,
};

export type HubChatCtx = {
  agent: HubAgentKey;
  briefing: string;
  askerName: string;
  askerIsOwner: boolean;
  history: { role: "USER" | "AGENT"; text: string }[];
  message: string;
};

const stepShape = z.object({
  title: z.string().describe("Imperative, under 10 words"),
  detail: z.string().describe("One sentence: what done looks like"),
  stage: z.enum(["VALIDATE", "SETUP", "BUILD", "LAUNCH"]),
  needs: z.array(z.enum(["COFOUNDER", "SUPPLIER", "LEGAL", "FUNDING", "MARKETING", "GTM", "WEBSITE", "MENTOR"])),
});

export const hubChatSchema = z.object({
  reply: z.string().describe("Your reply. Plain text with line breaks; '- ' for lists; no markdown headings or bold."),
  suggestedStep: stepShape
    .nullable()
    .describe("A concrete next step worth adding to their game plan, only if the reply clearly implies one and it isn't already in the plan. Otherwise null."),
});

/** One reply from a hub agent, in the context of the whole hub. */
export const hubChatAgent = defineAgent({
  purpose: "hub.chat",
  effort: "medium",
  cacheSystem: true,
  schema: hubChatSchema,
  // The system prompt holds the role and the hub briefing: stable for a whole
  // conversation, so it's cached.
  system: (ctx: HubChatCtx) => `${SELF_VOICE}

${ROLE[ctx.agent]}

Only use facts from the briefing below or what the founder tells you. If
something important is missing, say what you'd need to know. Keep replies
tight: usually under 200 words.

=== HUB BRIEFING ===
${ctx.briefing}
=== END BRIEFING ===`,
  prompt: (ctx: HubChatCtx) => {
    const recent = ctx.history.slice(-12);
    return `${recent.length ? `Conversation so far:\n${recent.map((m) => `${m.role === "USER" ? ctx.askerName.split(" ")[0] : "You"}: ${m.text}`).join("\n\n")}\n\n` : ""}${ctx.askerName.split(" ")[0]}${ctx.askerIsOwner ? " (the founder)" : " (a team member)"} says:
${ctx.message}`;
  },
  demo: (ctx) => demoReply(ctx),
});

/** Picks which hub agent should answer a free-form question ("Ask SELF anything"). */
export const routerAgent = defineAgent({
  purpose: "hub.route",
  effort: "low",
  schema: z.object({
    agent: z.enum(["strategy", "gtm", "ops", "fundraising", "legal"]),
  }),
  system: () => `You route a founder's question to the right specialist:
strategy (big calls, priorities, risk, thesis), gtm (customers, marketing,
sales, launch), ops (suppliers, production, logistics, pilots, hiring
process), fundraising (pitch, investors, backers, grants), legal (company
formation, contracts, IP, compliance, equity paperwork). Pick one.`,
  prompt: (ctx: { question: string }) => ctx.question,
  demo: (ctx) => ({ agent: routeByKeywords(ctx.question) }),
});

export function routeByKeywords(q: string): HubAgentKey {
  const s = q.toLowerCase();
  if (/(legal|lawyer|contract|trademark|patent|\bip\b|incorporat|formation|form the company|vesting|licen[cs]e|compliance|gdpr|liabil)/.test(s)) return "legal";
  if (/(investor|pitch|raise|raising|backer|deck|fundrais|grant|seed|angel)/.test(s)) return "fundraising";
  if (/(supplier|manufactur|production|logistic|inventory|pilot|operations|shipping|warehouse|process)/.test(s)) return "ops";
  if (/(customer|marketing|launch|channel|brand|position|sales|sell|message|audience|social)/.test(s)) return "gtm";
  return "strategy";
}

function demoReply(ctx: HubChatCtx): z.infer<typeof hubChatSchema> {
  const hubName = /HUB: ([^(.]+)/.exec(ctx.briefing)?.[1]?.trim() ?? "your hub";
  const nextStep = /- \[ \] [^:]+: (.+?)(?: \(needs|$)/m.exec(ctx.briefing)?.[1]?.trim();
  const first = ctx.askerName.split(" ")[0];
  const replies: Record<HubAgentKey, string> = {
    strategy: `Straight answer, ${first}: the biggest risk in ${hubName} is still the assumption nobody has paid for yet. Everything else is execution.\n\n- Prove one customer will pay before building more.\n- ${nextStep ? `Your next open step, "${nextStep}", is the right place to test it.` : "Pick one step that tests willingness to pay."}\n- Cut anything that doesn't move that proof forward this month.`,
    gtm: `For ${hubName}, I'd start where you already have trust.\n\n- Message the people you interviewed first; they're warm.\n- One channel for four weeks, with a number to hit: 20 conversations, 5 pilots.\n- Keep the message to one line: who it's for, what it replaces.`,
    ops: `Before any first order for ${hubName}, pin down:\n\n- Minimum order and lead time, in writing.\n- What happens if the sample passes but the batch fails.\n- Who inspects, where, and against what spec.\n\nA supplier from SELF's directory can shortcut the first two.`,
    fundraising: `Let's drill. First question, the way a sceptical backer would ask it:\n\n"Why hasn't someone bigger already done this, and what stops them doing it next year?"\n\nAnswer in three sentences or fewer, and I'll push back.`,
    legal: `In plain English: founder vesting means each founder earns their shares over time, usually four years with a one-year cliff. If someone leaves early, they keep only what they've earned. It protects the people who stay.\n\nQuestions worth taking to a lawyer:\n- What vesting schedule and cliff suit a team our size, in our country?\n- What happens to unvested shares if a founder leaves?\n\nThis isn't legal advice. Confirm with a lawyer; SELF's Legal partners can help.`,
  };
  const suggested: Record<HubAgentKey, z.infer<typeof hubChatSchema>["suggestedStep"]> = {
    strategy: { title: "Get one paid commitment before building more", detail: "One customer pays a deposit or signs a paid pilot.", stage: "VALIDATE", needs: [] },
    gtm: { title: "Four-week channel test with a target", detail: "20 conversations and 5 pilot sign-ups from one channel.", stage: "LAUNCH", needs: ["GTM"] },
    ops: { title: "Get supplier terms in writing", detail: "Minimum order, lead time and failure terms agreed before the first order.", stage: "BUILD", needs: ["SUPPLIER"] },
    fundraising: null,
    legal: null,
  };
  return { reply: replies[ctx.agent], suggestedStep: suggested[ctx.agent] };
}
