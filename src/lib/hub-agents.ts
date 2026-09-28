/** A hub's agent roster (shared client + server). Prompts live in src/agents. */
export const HUB_AGENTS = ["strategy", "gtm", "ops", "fundraising", "legal"] as const;
export type HubAgentKey = (typeof HUB_AGENTS)[number];

export const HUB_AGENT_COPY: Record<HubAgentKey, { name: string; role: string; line: string; starters: string[] }> = {
  strategy: {
    name: "Strategy",
    role: "Strategy agent",
    line: "The big calls: what to do next, what to cut, where the risk is.",
    starters: [
      "What's the riskiest assumption in my plan right now?",
      "If I could only do three things this month, which three?",
      "Play devil's advocate on my thesis.",
    ],
  },
  gtm: {
    name: "Go-to-market",
    role: "GTM agent",
    line: "Customers, channels, positioning and the launch.",
    starters: [
      "Write three cold messages to my first customers.",
      "Which channel should I test first, and how?",
      "What should launch week look like?",
    ],
  },
  ops: {
    name: "Operations",
    role: "Operations agent",
    line: "Suppliers, production, logistics and running the thing.",
    starters: [
      "What should I ask a supplier before a first order?",
      "Draft a checklist for our pilot.",
      "Where could this break when we get busy?",
    ],
  },
  fundraising: {
    name: "Fundraising prep",
    role: "Fundraising agent",
    line: "Your pitch story, and practice for investor questions.",
    starters: [
      "Drill me with investor questions, one at a time.",
      "Help me tell the story in five sentences.",
      "What will a sceptical backer push on?",
    ],
  },
  legal: {
    name: "Legal explainer",
    role: "Legal explainer",
    line: "Explains concepts and preps questions for a lawyer. Not legal advice.",
    starters: [
      "Explain founder vesting in plain English.",
      "What should I ask a lawyer before forming the company?",
      "What does an IP assignment actually do?",
    ],
  },
};

export const isHubAgent = (k: string): k is HubAgentKey => (HUB_AGENTS as readonly string[]).includes(k);
