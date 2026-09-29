/**
 * Help by area: eight parts of building a company, each with a specialist
 * agent, a working page of sections, the plan steps it covers and the kinds
 * of people on SELF who do this work. Pure config, shared by client and server.
 */
import type { Need } from "./needs";
import type { WorkspaceAgentKey } from "./workspace-agents";

export const AREA_KEYS = ["gtm", "marketing", "sales", "product", "legal", "fundraising", "hiring", "ops"] as const;
export type AreaKey = (typeof AREA_KEYS)[number];

type PartnerCategory = "SUPPLIER" | "LEGAL" | "WEBSITE" | "MARKETING" | "GTM" | "DESIGN" | "FINANCE";

export type Area = {
  key: AreaKey;
  name: string;
  mark: string;
  line: string;
  agent: WorkspaceAgentKey;
  /** Plan steps with any of these needs belong to this area. */
  needs: Need[];
  partnerCategories: PartnerCategory[];
  /** Mentors with any of these focus areas can help. */
  mentorFocus: string[];
  /** Team members whose title mentions one of these words own it. */
  titleWords: string[];
  sections: { key: string; title: string; hint: string }[];
  /** A fixed note shown on the area (legal, fundraising). */
  note?: string;
};

export const AREAS: Record<AreaKey, Area> = {
  gtm: {
    key: "gtm",
    name: "Go-to-market",
    mark: "Gt",
    line: "How the first buyers hear about you, and why they say yes.",
    agent: "gtm",
    needs: ["GTM"],
    partnerCategories: ["GTM"],
    mentorFocus: ["Go-to-market"],
    titleWords: ["growth", "go-to-market", "gtm", "commercial"],
    sections: [
      { key: "positioning", title: "Positioning", hint: "One sentence: who it's for and what it replaces." },
      { key: "customers", title: "First customers", hint: "Specific enough to name ten of them." },
      { key: "channels", title: "Channels", hint: "Where those customers already are, and one cheap test for each." },
      { key: "launch", title: "Launch plan", hint: "The first four weeks, with a number to hit." },
    ],
  },
  marketing: {
    key: "marketing",
    name: "Marketing & brand",
    mark: "Mk",
    line: "How you sound, what you say, and the first weeks of launch.",
    agent: "marketing",
    needs: ["MARKETING", "DESIGN", "WEBSITE"],
    partnerCategories: ["MARKETING", "DESIGN", "WEBSITE"],
    mentorFocus: ["Brand", "Consumer", "Creative"],
    titleWords: ["brand", "marketing", "design", "story"],
    sections: [
      { key: "voice", title: "How we sound", hint: "Three words for the voice, and three you'd never use." },
      { key: "messages", title: "Messages that work", hint: "Lines customers repeated back to you." },
      { key: "calendar", title: "First weeks of launch", hint: "Week by week: what goes out and who owns it." },
      { key: "assets", title: "What we need made", hint: "Site, photos, samples, decks: and who makes them." },
    ],
  },
  sales: {
    key: "sales",
    name: "Sales",
    mark: "Sa",
    line: "First buyers, the pipeline, pricing talks and objections.",
    agent: "sales",
    needs: ["GTM"],
    partnerCategories: ["GTM"],
    mentorFocus: ["Go-to-market", "B2B software", "Marketplaces"],
    titleWords: ["sales", "commercial", "business development"],
    sections: [
      { key: "buyers", title: "Who buys, and why", hint: "The person who signs, and what they need to hear." },
      { key: "pipeline", title: "Pipeline", hint: "Every live conversation and its next step." },
      { key: "pricing", title: "Pricing conversations", hint: "How you'll talk about price. Use [PRICE] until you decide." },
      { key: "objections", title: "Objections", hint: "What you'll hear, word for word, and your answer." },
    ],
  },
  product: {
    key: "product",
    name: "Product",
    mark: "Pr",
    line: "What you're making, what it must do, and what you're testing.",
    agent: "product",
    needs: ["DESIGN", "WEBSITE", "SUPPLIER"],
    partnerCategories: ["DESIGN", "WEBSITE", "SUPPLIER"],
    mentorFocus: ["Product", "Hardware"],
    titleWords: ["product", "technology", "engineering", "cto"],
    sections: [
      { key: "what", title: "What we're making", hint: "The first version, in plain words." },
      { key: "must", title: "What it must do", hint: "The few things version one can't ship without." },
      { key: "testing", title: "What we're testing", hint: "The riskiest assumption and the test for it." },
      { key: "decisions", title: "Decisions made", hint: "What you chose, and why, so nobody reopens it." },
    ],
  },
  legal: {
    key: "legal",
    name: "Legal",
    mark: "Lg",
    line: "Company, contracts and IP, explained. Not legal advice.",
    agent: "legal",
    needs: ["LEGAL"],
    partnerCategories: ["LEGAL"],
    mentorFocus: [],
    titleWords: ["legal", "counsel"],
    sections: [
      { key: "company", title: "Company and ownership", hint: "Where you're forming, who owns what, vesting." },
      { key: "contracts", title: "Contracts", hint: "Customer, supplier and partner agreements you'll need." },
      { key: "ip", title: "IP", hint: "What you've made, and who it belongs to." },
      { key: "questions", title: "Questions for a lawyer", hint: "Bring these to a legal partner." },
    ],
    note: "The legal agent explains and helps you prepare questions. It isn't a lawyer, and nothing here is legal advice.",
  },
  fundraising: {
    key: "fundraising",
    name: "Fundraising prep",
    mark: "Fu",
    line: "Your story, and practice for backer questions. Prep only.",
    agent: "fundraising",
    needs: ["FUNDING"],
    partnerCategories: ["FINANCE"],
    mentorFocus: ["Fundraising"],
    titleWords: ["finance", "cfo"],
    sections: [
      { key: "story", title: "The story in five sentences", hint: "Problem, who, why now, why you, what's next." },
      { key: "questions", title: "What a backer will ask", hint: "The hard questions, and your honest answers." },
      { key: "proof", title: "Proof so far", hint: "What you've shown, not what you hope." },
    ],
    note: "SELF doesn't raise money or offer investments. This is preparation for conversations with backers.",
  },
  hiring: {
    key: "hiring",
    name: "Hiring & team",
    mark: "Hi",
    line: "Who you need, how you'll work together, and what to agree early.",
    agent: "hiring",
    needs: ["COFOUNDER"],
    partnerCategories: [],
    mentorFocus: ["Hiring"],
    titleWords: ["people", "hiring", "talent"],
    sections: [
      { key: "roles", title: "Who we need", hint: "The chairs that are open, and why each matters now." },
      { key: "together", title: "How we work together", hint: "Who owns what, and how you decide when you disagree." },
      { key: "agree", title: "What to agree early", hint: "Time, roles, and how equity is discussed. Use [SPLIT] until a lawyer helps." },
    ],
  },
  ops: {
    key: "ops",
    name: "Operations & budget",
    mark: "Op",
    line: "Suppliers, production, the weekly rhythm and the budget as plain numbers.",
    agent: "ops",
    needs: ["SUPPLIER", "FINANCE"],
    partnerCategories: ["SUPPLIER", "FINANCE"],
    mentorFocus: ["Operations", "Supply chain"],
    titleWords: ["operations", "ops", "supply", "production"],
    sections: [
      { key: "suppliers", title: "Suppliers", hint: "Who makes what, terms in writing, and a backup." },
      { key: "production", title: "Production", hint: "How it gets made, checked and shipped." },
      { key: "budget", title: "Budget", hint: "What you spend each month, as plain numbers you track. Nothing moves money here." },
      { key: "rhythm", title: "Weekly rhythm", hint: "Meetings, reviews, and who checks what." },
    ],
  },
};

export const isAreaKey = (k: string): k is AreaKey => (AREA_KEYS as readonly string[]).includes(k);

/** The page that holds an area's sections. */
export const areaSystemKey = (k: AreaKey) => `area:${k}`;

/** Areas a plan step belongs to, from its needs. */
export function areasForNeeds(needs: string[]): AreaKey[] {
  return AREA_KEYS.filter((k) => AREAS[k].needs.some((n) => needs.includes(n)));
}
