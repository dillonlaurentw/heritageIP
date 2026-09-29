/**
 * What a game-plan step can need, and where each need leads in the network.
 * Shared by client, server and seed. The game plan's "Needs" property uses
 * these ids as its option ids.
 */
import type { TagColor } from "@/components/ui/Tag";
import { CATEGORY_COPY } from "./partner-categories";

export const NEED_TAGS = ["COFOUNDER", "SUPPLIER", "LEGAL", "MARKETING", "GTM", "WEBSITE", "DESIGN", "FINANCE", "FUNDING", "MENTOR"] as const;
export type Need = (typeof NEED_TAGS)[number];

export const NEEDS: Record<Need, { slug: string; label: string; color: TagColor; line: string }> = {
  COFOUNDER: { slug: "cofounder", label: "Co-founder", color: "purple", line: "Post the role; builders signal interest and you choose who joins." },
  SUPPLIER: { slug: "supplier", label: "Supplier", color: "orange", line: "Manufacturers, sourcing brokers and suppliers." },
  LEGAL: { slug: "legal", label: "Legal", color: "red", line: "Formation, equity, contracts and IP." },
  MARKETING: { slug: "marketing", label: "Marketing", color: "pink", line: "Brand, content and growth partners." },
  GTM: { slug: "gtm", label: "Go-to-market", color: "yellow", line: "Sales, distribution and channel partners." },
  WEBSITE: { slug: "website", label: "Website & build", color: "blue", line: "Studios and developers for your site and product." },
  DESIGN: { slug: "design", label: "Design", color: "brown", line: "Product, brand and packaging design." },
  FINANCE: { slug: "finance", label: "Finance", color: "gray", line: "Bookkeeping, payroll and runway." },
  FUNDING: { slug: "funding", label: "Funding", color: "green", line: "Open your workspace to backers. Interest only; no money moves on SELF." },
  MENTOR: { slug: "mentor", label: "Mentor", color: "purple", line: "Someone who's done it, one request away." },
};

/** Needs served by the partner directory, and the category each maps to. */
export const NEED_TO_CATEGORY: Partial<Record<Need, "SUPPLIER" | "LEGAL" | "WEBSITE" | "MARKETING" | "GTM" | "DESIGN" | "FINANCE">> = {
  SUPPLIER: "SUPPLIER",
  LEGAL: "LEGAL",
  WEBSITE: "WEBSITE",
  MARKETING: "MARKETING",
  GTM: "GTM",
  DESIGN: "DESIGN",
  FINANCE: "FINANCE",
};

export const needFromSlug = (slug: string) => (Object.keys(NEEDS) as Need[]).find((k) => NEEDS[k].slug === slug) ?? null;

/** Where a need tag on a step leads. `stepId` ties the resulting request to the step. */
export function needHref(need: Need, workspaceSlug: string, stepId?: string) {
  const q = new URLSearchParams({ ws: workspaceSlug, ...(stepId ? { step: stepId } : {}) });
  if (need === "COFOUNDER") return `/network/roles/post?${q}`;
  if (need === "FUNDING") return `/w/${workspaceSlug}/backers`;
  if (need === "MENTOR") return `/network/mentors?${q}`;
  const category = NEED_TO_CATEGORY[need];
  return `/network/partners?${new URLSearchParams({ ...(category ? { c: CATEGORY_COPY[category].slug } : {}), ws: workspaceSlug, ...(stepId ? { step: stepId } : {}) })}`;
}

/** Which quarter of the ring each need fills. */
export const NEED_THEME: Record<Need, "COFOUNDERS" | "PARTNERS" | "ADVISORS" | "CAPITAL"> = {
  COFOUNDER: "COFOUNDERS",
  SUPPLIER: "PARTNERS",
  LEGAL: "PARTNERS",
  MARKETING: "PARTNERS",
  GTM: "PARTNERS",
  WEBSITE: "PARTNERS",
  DESIGN: "PARTNERS",
  FINANCE: "PARTNERS",
  MENTOR: "ADVISORS",
  FUNDING: "CAPITAL",
};

/** How an open chair for a need reads on the ring ("A legal partner"). */
export const NEED_CHAIR: Record<Need, string> = {
  COFOUNDER: "A co-founder",
  SUPPLIER: "A supplier",
  LEGAL: "A legal partner",
  MARKETING: "A marketing partner",
  GTM: "A go-to-market partner",
  WEBSITE: "A build studio",
  DESIGN: "A designer",
  FINANCE: "A finance partner",
  MENTOR: "A mentor",
  FUNDING: "Backers",
};

/** How a need reads on a plan step: "Partner · legal", "Co-founder". */
export function needChip(n: Need) {
  if (n === "COFOUNDER") return "Co-founder";
  if (n === "MENTOR") return "Advisor · mentor";
  if (n === "FUNDING") return "Capital · backers";
  return `Partner · ${NEEDS[n].label.toLowerCase()}`;
}
