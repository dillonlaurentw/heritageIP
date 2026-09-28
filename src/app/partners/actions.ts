"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requestIntro } from "@/lib/partners";
import { requireOnboarded } from "@/lib/session";

const intro = z.object({
  partnerId: z.string().min(1),
  hubId: z.string().min(1, "Pick the hub this is for."),
  planStepId: z.string().nullable(),
  note: z.string().trim().min(20, "Tell them a bit more: what you need and by when.").max(1000),
});

export async function askForIntro(input: z.input<typeof intro>) {
  const viewer = await requireOnboarded();
  const parsed = intro.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const res = await requestIntro({ fromUserId: viewer.user.id, ...parsed.data });
  revalidatePath("/", "layout");
  return res;
}

const profile = z.object({
  tagline: z.string().trim().min(5).max(140),
  description: z.string().trim().min(20).max(2000),
  services: z.array(z.string().trim().min(1).max(60)).max(10),
  location: z.string().trim().min(2).max(80),
  priceNote: z
    .string()
    .trim()
    .max(140)
    .transform((v) => v || null),
  website: z
    .string()
    .trim()
    .transform((v) => v || null)
    .pipe(z.url("Use a full link, starting with https://").nullable()),
  contactEmail: z.email("That doesn't look like an email."),
});

/** Partners edit their own profile (the one they've claimed). */
export async function updatePartner(partnerId: string, input: z.input<typeof profile>) {
  const viewer = await requireOnboarded();
  const partner = await db.partner.findUnique({ where: { id: partnerId } });
  if (!partner || partner.claimedById !== viewer.user.id) return { ok: false as const, message: "Not your profile." };
  const parsed = profile.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  await db.partner.update({ where: { id: partnerId }, data: parsed.data });
  revalidatePath(`/partners/${partner.slug}`);
  return { ok: true as const };
}
