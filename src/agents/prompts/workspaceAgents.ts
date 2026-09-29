import { z } from "zod";
import { NEED_TAGS } from "@/lib/needs";
import { LEGAL_DISCLAIMER, WORKSPACE_AGENTS, routeByKeywords, type WorkspaceAgentKey } from "@/lib/workspace-agents";
import { SELF_VOICE } from "../context";
import { defineAgent } from "../define";

/*
 * The five workspace agents. One output shape, one conversation format;
 * each has its own role brief below. Tune them here.
 */

const ROLE: Record<WorkspaceAgentKey, string> = {
  strategy: `You are this company's STRATEGY agent. You help the team make the big calls:
what to do next, what to cut, where the risk is, and whether the thesis holds.
Challenge assumptions directly and name trade-offs. Prefer one clear
recommendation over a menu of options.`,

  gtm: `You are this company's GO-TO-MARKET agent. You help the team find and win the
first customers: positioning, target customers, channels, messages and the
launch. Be concrete: real kinds of places, people and events, and cheap tests
with numbers to hit. Build on their Go-to-market page if it exists.`,

  marketing: `You are this company's MARKETING & BRAND agent. You help the team decide how
the company sounds and what it says: brand voice, the lines on the site, launch
content and the assets they need. Ground everything in what customers actually
said. Be concrete: write the line, don't describe it. Name where a marketing or
design partner from SELF's directory would help.`,

  sales: `You are this company's SALES agent. You help the team win the first paying
customers: who signs, what they need to hear, the pipeline, pricing
conversations and objections. Be specific to this buyer. Never invent prices or
numbers; use placeholders like [PRICE] where the team must decide.`,

  product: `You are this company's PRODUCT agent. You help decide what to make first, what
it must do, what can wait, and how to test the riskiest assumption cheaply.
Prefer the smallest real version in a customer's hands. Flag where a build,
design or manufacturing partner from SELF's directory would help.`,

  hiring: `You are this company's HIRING & TEAM agent. You help the founders decide who
they need, write roles that attract the right person, run trial weeks, and
prepare the conversations co-founders should have early (roles, time
commitment, decision-making, how equity is discussed). You are not a lawyer:
for agreements, point them to a legal partner. Never suggest salary figures,
equity percentages or terms; use placeholders like [SPLIT].`,

  ops: `You are this company's OPERATIONS agent. You help with suppliers, production,
logistics, pilots, hiring process and day-to-day running. Be practical:
checklists, questions to ask suppliers, failure points, and what to measure.
Flag where a partner from SELF's directory would help.`,

  fundraising: `You are this company's FUNDRAISING PREP agent. You help the founder tell the
story and practise for backer conversations. When asked to drill, ask ONE
tough question at a time, then critique their answer briefly and ask the next.
You help them prepare; you never draft offering documents, solicitations or
anything that offers securities, and you never suggest amounts, valuations or
terms. SELF only makes introductions and no money moves on SELF; say so if
they ask SELF to raise money for them.`,

  legal: `You are this company's LEGAL EXPLAINER. You are not a lawyer and this is not
legal advice. You may explain legal concepts in plain language, describe
what's commonly done and why, and help the founder prepare good questions for
a lawyer. You must NOT tell them what they should do legally, draft binding
documents, or interpret their specific obligations. End every reply with this
line exactly: "${LEGAL_DISCLAIMER}" Law varies by country; say so when it matters.`,
};

export type AgentChatCtx = {
  agent: WorkspaceAgentKey;
  briefing: string;
  askerName: string;
  askerRole: string;
  history: { role: "USER" | "AGENT"; text: string }[];
  message: string;
};

const stepShape = z.object({
  title: z.string().describe("Imperative, under 10 words"),
  detail: z.string().describe("One sentence: what done looks like"),
  stage: z.enum(["VALIDATE", "SETUP", "BUILD", "LAUNCH"]),
  needs: z.array(z.enum(NEED_TAGS)),
});

export const agentChatSchema = z.object({
  reply: z.string().describe("Your reply. Markdown allowed: short paragraphs, '- ' lists, **bold** sparingly. No headings."),
  suggestedTasks: z
    .array(z.object({ title: z.string().describe("Imperative, under 10 words"), detail: z.string().describe("One sentence") }))
    .max(5)
    .describe("Concrete tasks the reply implies, only if it clearly implies some. Otherwise empty."),
  suggestedStep: stepShape
    .nullable()
    .describe("A game-plan step worth adding, only if the reply clearly implies one and it isn't already in the plan. Otherwise null."),
});
export type AgentChatOutput = z.infer<typeof agentChatSchema>;

/** One reply from a workspace agent, with the whole workspace as context. */
export const agentChatAgent = defineAgent({
  purpose: "workspace.chat",
  effort: "medium",
  // The role and briefing are stable for a conversation, so they're cached.
  cacheSystem: true,
  schema: agentChatSchema,
  system: (ctx: AgentChatCtx) => `${SELF_VOICE}

${ROLE[ctx.agent]}

Only use facts from the briefing below or what the person tells you. If
something important is missing, say what you'd need to know. Keep replies
tight: usually under 220 words.

=== WORKSPACE BRIEFING ===
${ctx.briefing}
=== END BRIEFING ===`,
  prompt: (ctx: AgentChatCtx) => {
    const first = ctx.askerName.split(" ")[0];
    const recent = ctx.history.slice(-12);
    return `${recent.length ? `Conversation so far:\n${recent.map((m) => `${m.role === "USER" ? first : "You"}: ${m.text}`).join("\n\n")}\n\n` : ""}${first} (${ctx.askerRole}) says:
${ctx.message}`;
  },
  demo: (ctx) => demoReply(ctx),
});

/** Picks which workspace agent should answer a free-form question ("Ask SELF anything"). */
export const routerAgent = defineAgent({
  purpose: "workspace.route",
  effort: "low",
  schema: z.object({ agent: z.enum(WORKSPACE_AGENTS) }),
  system: () => `You route a founder's question to the right specialist:
strategy (big calls, priorities, risk, thesis), gtm (positioning, customers,
channels, launch), marketing (brand, voice, content, site copy), sales (buyers,
pipeline, pricing talks, objections), product (what to build, specs, tests),
hiring (co-founders, roles, trial weeks, working together), ops (suppliers,
production, logistics, budget), fundraising (pitch, backers, grants), legal
(company formation, contracts, IP, compliance, equity paperwork). Pick one.`,
  prompt: (ctx: { question: string }) => ctx.question,
  demo: (ctx) => ({ agent: routeByKeywords(ctx.question) }),
});

function demoReply(ctx: AgentChatCtx): AgentChatOutput {
  const company = /COMPANY: ([^(\n]+)/.exec(ctx.briefing)?.[1]?.trim() ?? "your company";
  const nextStep = /- \[ \] (.+?)(?: \(needs|$)/m.exec(ctx.briefing)?.[1]?.trim();
  const first = ctx.askerName.split(" ")[0];
  const replies: Record<WorkspaceAgentKey, string> = {
    strategy: `Straight answer, ${first}: the biggest risk in ${company} is still the assumption nobody has paid for yet. Everything else is execution.\n\n- Prove one customer will pay before building more.\n- ${nextStep ? `Your next open step, **${nextStep}**, is the right place to test it.` : "Pick one step that tests willingness to pay."}\n- Cut anything that doesn't move that proof forward this month.`,
    gtm: `For ${company}, start where you already have trust.\n\n- Message the people you interviewed first; they're warm.\n- One channel for four weeks, with a number to hit: 20 conversations, 5 pilots.\n- Keep the message to one line: who it's for, what it replaces.`,
    marketing: `Lead with what your customers already told you, ${first}.\n\n- One line: who it's for and what it saves them.\n- Three words for how ${company} sounds, and three it never uses.\n- One proof a buyer can check in ten seconds.`,
    sales: `Find the person who signs, not the person who likes it.\n\n- Ask each contact: "Who else needs to say yes?"\n- Turn a letter of intent into a small paid pilot at [PRICE].\n- Write down every objection word for word; they become your FAQ.`,
    product: `Put the smallest real version in someone's hands first.\n\n- Name the one thing it must do on day one.\n- List what can wait, and say so out loud.\n- ${nextStep ? `Use **${nextStep}** as the test.` : "Design one test for the riskiest assumption."}`,
    hiring: `Before anyone joins ${company}, talk through:\n\n- What each of you owns, and who decides when you disagree.\n- Time: full-time, part-time, and what changes it.\n- How equity will be discussed: [SPLIT] and vesting, with a lawyer.\n\nA trial week on something real says more than any interview.`,
    ops: `Before any first order for ${company}, pin down:\n\n- Minimum order and lead time, in writing.\n- What happens if the sample passes but the batch fails.\n- Who inspects, where, and against what spec.\n\nA supplier from SELF's directory can shortcut the first two.`,
    fundraising: `Let's drill. First question, the way a sceptical backer would ask it:\n\n**"Why hasn't someone bigger already done this, and what stops them doing it next year?"**\n\nAnswer in three sentences or fewer, and I'll push back.`,
    legal: `In plain English: founder vesting means each founder earns their shares over time, usually four years with a one-year cliff. If someone leaves early, they keep only what they've earned. It protects the people who stay.\n\nQuestions worth taking to a lawyer:\n- What vesting schedule and cliff suit a team our size, in our country?\n- What happens to unvested shares if a founder leaves?\n\n${LEGAL_DISCLAIMER}`,
  };
  const tasks: Record<WorkspaceAgentKey, AgentChatOutput["suggestedTasks"]> = {
    strategy: [{ title: "Ask three customers for a paid pilot", detail: "A deposit or a signed pilot, not a like." }],
    gtm: [
      { title: "List 20 warm contacts for the first channel", detail: "Names, not segments." },
      { title: "Write the one-line message and test it on five people", detail: "Keep the version that gets a question back." },
    ],
    marketing: [{ title: "Write the buyer site's first line", detail: "Three versions; test them on five buyers." }],
    sales: [{ title: "Map who signs at each prospect", detail: "Name the decision-maker for every letter of intent." }],
    product: [{ title: "Write the must-do list for version one", detail: "Everything else goes on a later list." }],
    hiring: [{ title: "Hold the founders' conversation", detail: "Roles, time, decisions and how equity is discussed." }],
    ops: [{ title: "Get supplier terms in writing", detail: "Minimum order, lead time and what happens if a batch fails." }],
    fundraising: [],
    legal: [{ title: "Book a first call with a startup lawyer", detail: "Bring the vesting questions above." }],
  };
  const step: Record<WorkspaceAgentKey, AgentChatOutput["suggestedStep"]> = {
    strategy: { title: "Get one paid commitment before building more", detail: "One customer pays a deposit or signs a paid pilot.", stage: "VALIDATE", needs: [] },
    gtm: { title: "Four-week channel test with a target", detail: "20 conversations and 5 pilot sign-ups from one channel.", stage: "LAUNCH", needs: ["GTM"] },
    marketing: { title: "Write the buyer site and cost sheet", detail: "One page a buyer understands in ten seconds.", stage: "LAUNCH", needs: ["MARKETING", "WEBSITE"] },
    sales: { title: "Turn one letter of intent into a paid pilot", detail: "A signed, paid pilot with one processor.", stage: "VALIDATE", needs: [] },
    product: { title: "Test the riskiest product assumption", detail: "One cheap test with a clear pass or fail.", stage: "VALIDATE", needs: [] },
    hiring: { title: "Run a trial week before any co-founder decision", detail: "A real piece of work together, then an honest talk.", stage: "SETUP", needs: ["COFOUNDER"] },
    ops: { title: "Agree supplier terms before the first order", detail: "Minimum order, lead time and failure terms in writing.", stage: "BUILD", needs: ["SUPPLIER"] },
    fundraising: null,
    legal: null,
  };
  return { reply: replies[ctx.agent], suggestedTasks: tasks[ctx.agent], suggestedStep: step[ctx.agent] };
}
