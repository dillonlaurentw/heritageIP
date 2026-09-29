/**
 * What a game-plan step can need, and where each need leads in the network.
 * Shared by client, server and seed. The game plan's "Needs" property uses
 * these ids as its option ids.
 */
import type { TagColor } from "@/components/ui/Tag";

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
  return `/network/partners?${new URLSearchParams({ c: NEEDS[need].slug, ws: workspaceSlug, ...(stepId ? { step: stepId } : {}) })}`;
}
