/**
 * Request shapes for the Self API (/api/v1). Pure: the route handlers, the
 * sandbox console and the docs all read from here so they can't drift.
 */
import { z } from "zod";
import { CATEGORY_KEYS } from "./domains";
import { PURPOSES, RESULTS } from "./rules";

export const customerId = z.string().regex(/^[A-Za-z0-9_.:@-]{1,128}$/, "Use your own user id: letters, numbers and _ . : @ - (max 128).");
const category = z.enum(CATEGORY_KEYS as [string, ...string[]]);
const value = z.string().trim().min(1).max(80);
const attr = z.object({ category, value });

export const linkCustomerBody = z.object({
  id: customerId,
  display_name: z.string().trim().max(120).optional(),
  email: z.email().max(200).optional(),
  consent: z.object({ personalization: z.boolean().optional(), ai_agents: z.boolean().optional() }).optional(),
});

export const consentBody = z
  .object({ personalization: z.boolean().optional(), ai_agents: z.boolean().optional() })
  .refine((c) => c.personalization !== undefined || c.ai_agents !== undefined, "Send personalization, ai_agents or both.");

export const preferencesBody = z
  .object({
    preferences: z.array(z.object({ category, value, stance: z.enum(["LIKES", "AVOIDS"]), note: z.string().trim().max(200).optional() })).max(50).default([]),
    forget: z.array(attr).max(50).default([]),
  })
  .refine((b) => b.preferences.length + b.forget.length > 0, "Send at least one preference or one thing to forget.");

export const eventBody = z.object({
  kind: z.string().regex(/^[a-z][a-z0-9_.]{1,39}$/, "A short lowercase kind, like feedback or purchase."),
  summary: z.string().trim().min(1).max(280),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const contextBody = z.object({
  customer_id: customerId,
  purpose: z.enum(PURPOSES as [string, ...string[]]).transform((p) => p as (typeof PURPOSES)[number]),
  query: z.string().trim().max(500).optional(),
  categories: z.array(category).max(CATEGORY_KEYS.length).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const outcomeBody = z.object({
  context_id: z.string().min(1).max(64),
  result: z.enum(RESULTS),
  item: z.object({ name: z.string().trim().min(1).max(160), attributes: z.array(attr).max(20).default([]) }),
  because: z.array(attr).max(20).optional(),
  note: z.string().trim().max(280).optional(),
});

export const shareRequestBody = z.object({
  customer_id: customerId,
  from_service: z.string().min(1).max(40),
  categories: z.array(category).min(1).max(CATEGORY_KEYS.length),
  reason: z.string().trim().min(1).max(280),
});
