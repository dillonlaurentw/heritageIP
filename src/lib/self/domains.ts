/**
 * Domain packs: the categories Self understands for one kind of service.
 * Shopping and discovery is the only pack today. A new kind of service adds
 * a pack here; the API, storage and permission model stay the same.
 * Pure: safe to import from client components, tests and seed code.
 */

export type CategoryDef = {
  key: string;
  label: string;
  /** What a value looks like, for docs and the sandbox. */
  example: string;
  /** Query words that make this category relevant even when no value matches. */
  cues: string[];
};

export type DomainPack = { key: string; label: string; categories: CategoryDef[] };

export const SHOPPING: DomainPack = {
  key: "shopping",
  label: "Shopping and discovery",
  categories: [
    {
      key: "style",
      label: "Style",
      example: "minimal, no logos",
      cues: ["style", "look", "outfit", "wear", "jacket", "coat", "dress", "shirt", "sofa", "decor", "lamp", "gift"],
    },
    {
      key: "color",
      label: "Colour",
      example: "muted earth tones",
      cues: ["color", "colour", "shade", "palette", "tone", "jacket", "coat", "shirt", "dress", "sweater", "bag", "throw", "blanket", "sofa", "rug", "bedding"],
    },
    {
      key: "material",
      label: "Material",
      example: "merino wool",
      cues: ["material", "fabric", "wool", "cotton", "leather", "linen", "down", "wood", "jacket", "sweater", "blanket", "rug"],
    },
    {
      key: "fit",
      label: "Size and fit",
      example: "shoe size EU 41, wide feet",
      cues: ["size", "fit", "shoe", "shoes", "boot", "boots", "trainer", "sneaker", "jacket", "pants", "trousers", "shirt", "dress"],
    },
    { key: "brand", label: "Brands", example: "Patagonia", cues: ["brand", "label", "maker"] },
    { key: "budget", label: "Budget", example: "under $150 for everyday items", cues: ["budget", "price", "cheap", "affordable", "cost", "spend", "deal", "gift"] },
    {
      key: "values",
      label: "Values",
      example: "repairable, made to last",
      cues: ["sustainable", "ethical", "recycled", "repair", "durable", "organic", "local"],
    },
    {
      key: "use",
      label: "How they'll use it",
      example: "commuting by bike in the rain",
      cues: ["for", "use", "commute", "hike", "hiking", "run", "running", "travel", "trip", "rain", "winter", "office", "camping", "kitchen"],
    },
  ],
};

export const DOMAINS: Record<string, DomainPack> = { shopping: SHOPPING };

export const CATEGORY_KEYS = SHOPPING.categories.map((c) => c.key);

export function categoryDef(key: string): CategoryDef | undefined {
  return SHOPPING.categories.find((c) => c.key === key);
}

export function categoryLabel(key: string): string {
  return categoryDef(key)?.label ?? key;
}
