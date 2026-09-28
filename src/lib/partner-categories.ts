/** Partner directory categories (shared client + server). */
export const PARTNER_CATEGORIES = ["SUPPLIER", "LEGAL", "WEBSITE", "MARKETING", "GTM", "DESIGN", "FINANCE", "OTHER"] as const;
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];

export const CATEGORY_COPY: Record<PartnerCategory, { label: string; slug: string }> = {
  SUPPLIER: { label: "Suppliers & manufacturing", slug: "suppliers" },
  LEGAL: { label: "Legal", slug: "legal" },
  WEBSITE: { label: "Website & build", slug: "build" },
  MARKETING: { label: "Marketing", slug: "marketing" },
  GTM: { label: "Go-to-market", slug: "go-to-market" },
  DESIGN: { label: "Design", slug: "design" },
  FINANCE: { label: "Finance & accounting", slug: "finance" },
  OTHER: { label: "Other", slug: "other" },
};

export const categoryFromSlug = (slug?: string | null) =>
  PARTNER_CATEGORIES.find((c) => CATEGORY_COPY[c].slug === slug) ?? null;
