/**
 * The synthetic world every new sandbox starts with: two fictional services
 * and a handful of made-up customers. None of these people or companies
 * exist. Emails use example.com, which is reserved for examples.
 *
 * Maya Okafor is a customer of both services with the same email, and the two
 * profiles are NOT connected. That is the point: Cadence can only see what
 * Fernhill knows after Maya approves a share request.
 */
import type { Source, Stance } from "./rules";

export type SeedPref = { category: string; value: string; stance: Stance; source: Source; evidence: number; note?: string; daysAgo: number };
export type SeedEvent = { kind: string; summary: string; daysAgo: number; data?: Record<string, unknown> };
export type SeedCustomer = {
  externalId: string;
  displayName: string;
  email: string;
  consent: { personalization: boolean; agents: boolean };
  prefs: SeedPref[];
  events: SeedEvent[];
};
export type SeedService = { slug: string; name: string; description: string; customers: SeedCustomer[] };

export const SANDBOX_DAYS = 3;

export const SEED_SERVICES: SeedService[] = [
  {
    slug: "cadence",
    name: "Cadence Outdoor",
    description: "A fictional outdoor and running store with an AI shopping assistant.",
    customers: [
      {
        externalId: "cad_1042",
        displayName: "Maya Okafor",
        email: "maya.okafor@example.com",
        consent: { personalization: true, agents: true },
        prefs: [
          { category: "material", value: "merino wool", stance: "LIKES", source: "STATED", evidence: 2, daysAgo: 20 },
          { category: "material", value: "synthetic down", stance: "AVOIDS", source: "OBSERVED", evidence: 2, note: "returned twice: too warm", daysAgo: 9 },
          { category: "fit", value: "shoe size eu 41", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 40 },
          { category: "fit", value: "wide toe box", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 40 },
          { category: "use", value: "commuting by bike in the rain", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 12 },
          { category: "budget", value: "under $200 for outerwear", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 12 },
          { category: "values", value: "a life without a car", stance: "LIKES", source: "STATED", evidence: 1, note: "in her words", daysAgo: 12 },
        ],
        events: [
          { kind: "purchase", summary: "Bought a merino base layer", daysAgo: 30, data: { item: "Ridge merino crew" } },
          { kind: "return", summary: "Returned a synthetic puffer: too warm for cycling", daysAgo: 9, data: { item: "Loft puffer" } },
          { kind: "feedback", summary: "Said she cycles to work most days, rain or not", daysAgo: 12 },
        ],
      },
      {
        externalId: "cad_2210",
        displayName: "Theo Lindqvist",
        email: "theo.lindqvist@example.com",
        consent: { personalization: true, agents: false },
        prefs: [
          { category: "use", value: "trail running", stance: "LIKES", source: "STATED", evidence: 3, daysAgo: 15 },
          { category: "fit", value: "shoe size eu 44", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 60 },
          { category: "brand", value: "stride lab", stance: "AVOIDS", source: "OBSERVED", evidence: 1, daysAgo: 22 },
        ],
        events: [{ kind: "feedback", summary: "Prefers to browse himself; turned off AI assistance", daysAgo: 15 }],
      },
      {
        externalId: "cad_3307",
        displayName: "Priya Raman",
        email: "priya.raman@example.com",
        consent: { personalization: false, agents: false },
        prefs: [],
        events: [],
      },
      {
        externalId: "cad_4518",
        displayName: "Sam Ortiz",
        email: "sam.ortiz@example.com",
        consent: { personalization: true, agents: true },
        prefs: [
          { category: "values", value: "repairable, made to last", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 3 },
          { category: "use", value: "weekend camping", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 3 },
        ],
        events: [{ kind: "feedback", summary: "Asked whether tents can be repaired in store", daysAgo: 3 }],
      },
    ],
  },
  {
    slug: "fernhill",
    name: "Fernhill Home",
    description: "A fictional home goods and textiles shop.",
    customers: [
      {
        externalId: "fh_0088",
        displayName: "Maya Okafor",
        email: "maya.okafor@example.com",
        consent: { personalization: true, agents: true },
        prefs: [
          { category: "color", value: "muted earth tones", stance: "LIKES", source: "STATED", evidence: 3, daysAgo: 50 },
          { category: "style", value: "minimal, no logos", stance: "LIKES", source: "STATED", evidence: 2, daysAgo: 50 },
          { category: "material", value: "linen", stance: "LIKES", source: "OBSERVED", evidence: 2, daysAgo: 18 },
          { category: "material", value: "polyester", stance: "AVOIDS", source: "OBSERVED", evidence: 1, note: "returned a polyester throw", daysAgo: 35 },
          { category: "values", value: "natural fibres", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 50 },
          { category: "values", value: "buy less, buy better", stance: "LIKES", source: "STATED", evidence: 2, daysAgo: 50 },
          { category: "budget", value: "under $120 for textiles", stance: "LIKES", source: "STATED", evidence: 1, daysAgo: 50 },
        ],
        events: [
          { kind: "purchase", summary: "Bought linen bedding in clay", daysAgo: 18 },
          { kind: "return", summary: "Returned a polyester throw: felt plasticky", daysAgo: 35 },
        ],
      },
      {
        externalId: "fh_0091",
        displayName: "Jonah Baptiste",
        email: "jonah.baptiste@example.com",
        consent: { personalization: true, agents: false },
        prefs: [
          { category: "style", value: "mid-century", stance: "LIKES", source: "STATED", evidence: 2, daysAgo: 10 },
          { category: "material", value: "walnut", stance: "LIKES", source: "OBSERVED", evidence: 1, daysAgo: 10 },
        ],
        events: [{ kind: "purchase", summary: "Bought a walnut side table", daysAgo: 10 }],
      },
    ],
  },
];
