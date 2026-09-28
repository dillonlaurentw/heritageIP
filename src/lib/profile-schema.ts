import { z } from "zod";

/** Shared (client + server) shape of editable profile fields. */
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => (v === "" ? null : v));

export const ROLE_CHOICES = ["BUILDER", "BACKER", "PARTNER", "MENTOR"] as const;

export const FOCUS_AREAS = [
  "Climate",
  "Health",
  "Food",
  "Consumer",
  "Fintech",
  "Hardware",
  "AI",
  "Education",
  "Creative",
  "Community",
  "B2B software",
  "Marketplaces",
  "Supply chain",
  "Brand",
  "Fundraising",
  "Hiring",
  "Product",
  "Go-to-market",
  "Operations",
] as const;

export const profileInput = z.object({
  name: z.string().trim().min(1, "We need something to call you.").max(80),
  headline: text(140),
  location: text(80),
  roles: z.array(z.enum(ROLE_CHOICES)).min(1, "Pick at least one."),
  beliefs: text(1200),
  workStyle: text(1200),
  buildingToward: text(1200),
  strengths: text(1200),
  gaps: text(1200),
  decisionStyle: text(1200),
  focusAreas: z.array(z.enum(FOCUS_AREAS)).max(8),
  mentorNote: text(600),
  backerNote: text(600),
  partnerOrgName: text(120),
  contactEmail: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.email("That doesn't look like an email.").nullable()),
  contactLink: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.url("Use a full link, starting with https://").nullable()),
});

export type ProfileInput = z.input<typeof profileInput>;
export const profileFieldsPartial = profileInput.partial();
