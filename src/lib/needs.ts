/**
 * What a game-plan step can need, and where each need leads. Shared by client
 * and server. Connection areas light up phase by phase.
 */
export const NEED_TAGS = ["COFOUNDER", "SUPPLIER", "LEGAL", "FUNDING", "MARKETING", "GTM", "WEBSITE", "MENTOR"] as const;
export type Need = (typeof NEED_TAGS)[number];

export const NEEDS: Record<Need, { slug: string; label: string; title: string; line: string; phase: number }> = {
  COFOUNDER: {
    slug: "cofounder",
    label: "Co-founder",
    title: "Find your people.",
    line: "Post the roles you need. Other builders signal interest, and you choose who joins.",
    phase: 4,
  },
  SUPPLIER: {
    slug: "supplier",
    label: "Supplier",
    title: "Find who makes it.",
    line: "Manufacturers, sourcing brokers and suppliers, introduced from inside your hub.",
    phase: 5,
  },
  LEGAL: {
    slug: "legal",
    label: "Legal",
    title: "Get it right on paper.",
    line: "Formation, equity, contracts and IP, with lawyers who work with early builders.",
    phase: 5,
  },
  WEBSITE: {
    slug: "website",
    label: "Website",
    title: "Get it built.",
    line: "Studios and developers for your site, product and first real version.",
    phase: 5,
  },
  MARKETING: {
    slug: "marketing",
    label: "Marketing",
    title: "Get it seen.",
    line: "Brand, content and growth partners for the story and the launch.",
    phase: 5,
  },
  GTM: {
    slug: "gtm",
    label: "Go-to-market",
    title: "Get it sold.",
    line: "Sales, distribution and channel partners who open the first doors.",
    phase: 5,
  },
  FUNDING: {
    slug: "funding",
    label: "Funding",
    title: "Find backers.",
    line: "Open your hub to backers. They signal interest; you decide who to talk to. No money moves on SELF.",
    phase: 6,
  },
  MENTOR: {
    slug: "mentor",
    label: "Mentor",
    title: "Learn from someone who's done it.",
    line: "Mentors with real experience in your area, one request away.",
    phase: 7,
  },
};

/** Needs served by the partner directory, and the category each maps to. */
export const NEED_TO_CATEGORY: Partial<Record<Need, "SUPPLIER" | "LEGAL" | "WEBSITE" | "MARKETING" | "GTM">> = {
  SUPPLIER: "SUPPLIER",
  LEGAL: "LEGAL",
  WEBSITE: "WEBSITE",
  MARKETING: "MARKETING",
  GTM: "GTM",
};

export const needFromSlug = (slug: string) =>
  (Object.keys(NEEDS) as Need[]).find((k) => NEEDS[k].slug === slug) ?? null;

/** Connection areas that are live. Grows as phases ship. */
export const LIVE_PHASE = 5;
