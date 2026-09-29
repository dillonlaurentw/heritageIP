/**
 * The workspace agents and the page assistant's actions. Pure: shared by
 * client and server. Prompts live in src/agents.
 */

export const WORKSPACE_AGENTS = ["strategy", "gtm", "ops", "fundraising", "legal"] as const;
export type WorkspaceAgentKey = (typeof WORKSPACE_AGENTS)[number];

export const AGENT_COPY: Record<WorkspaceAgentKey, { name: string; line: string; starters: string[] }> = {
  strategy: {
    name: "Strategy",
    line: "The big calls: what to do next, what to cut, where the risk is.",
    starters: [
      "What's the riskiest assumption in our plan right now?",
      "If we could only do three things this month, which three?",
      "Play devil's advocate on our thesis.",
    ],
  },
  gtm: {
    name: "Go-to-market",
    line: "Customers, channels, positioning and the launch.",
    starters: [
      "Write three cold messages to our first customers.",
      "Which channel should we test first, and how?",
      "What should launch week look like?",
    ],
  },
  ops: {
    name: "Operations",
    line: "Suppliers, production, hiring process and running the thing.",
    starters: [
      "What should we ask a supplier before a first order?",
      "Draft a checklist for our pilot.",
      "Where could this break when we get busy?",
    ],
  },
  fundraising: {
    name: "Fundraising prep",
    line: "Your story, and practice for backer questions. Prep only.",
    starters: [
      "Drill me with backer questions, one at a time.",
      "Help me tell the story in five sentences.",
      "What will a sceptical backer push on?",
    ],
  },
  legal: {
    name: "Legal explainer",
    line: "Explains concepts and preps questions for a lawyer. Not legal advice.",
    starters: [
      "Explain founder vesting in plain English.",
      "What should I ask a lawyer before forming the company?",
      "What does an IP assignment actually do?",
    ],
  },
};

export const isWorkspaceAgent = (k: string): k is WorkspaceAgentKey => (WORKSPACE_AGENTS as readonly string[]).includes(k);

/** Shown under every legal explainer reply, and appended by the server if missing. */
export const LEGAL_DISCLAIMER = "This isn't legal advice. Confirm with a lawyer; SELF's Legal partners can help.";

/** Keyword routing: used in demo mode and as a fallback when the router agent fails. */
export function routeByKeywords(q: string): WorkspaceAgentKey {
  const s = q.toLowerCase();
  if (/(legal|lawyer|contract|trademark|patent|\bip\b|incorporat|formation|form the company|vesting|licen[cs]e|compliance|gdpr|liabil)/.test(s)) return "legal";
  if (/(investor|pitch|raise|raising|backer|deck|fundrais|grant|seed|angel)/.test(s)) return "fundraising";
  if (/(supplier|manufactur|production|logistic|inventory|pilot|operations|shipping|warehouse|process|hire|hiring)/.test(s)) return "ops";
  if (/(customer|marketing|launch|channel|brand|position|sales|sell|message|audience|social)/.test(s)) return "gtm";
  return "strategy";
}

/** What "Ask AI" can do on a page. `needsSelection`: only offered with text selected. */
export const PAGE_ACTIONS = [
  { key: "draft", label: "Draft", hint: "Write something new here", needsSelection: false },
  { key: "rewrite", label: "Rewrite", hint: "Clearer, same meaning", needsSelection: true },
  { key: "shorter", label: "Make shorter", hint: "Half the words", needsSelection: true },
  { key: "summarize", label: "Summarise", hint: "The gist, in a few lines", needsSelection: false },
  { key: "tasks", label: "Turn into tasks", hint: "Action items for the Tasks database", needsSelection: false },
  { key: "continue", label: "Continue writing", hint: "Pick up where it stops", needsSelection: false },
] as const;
export type PageActionKey = (typeof PAGE_ACTIONS)[number]["key"];
export const PAGE_ACTION_KEYS = PAGE_ACTIONS.map((a) => a.key) as [PageActionKey, ...PageActionKey[]];
