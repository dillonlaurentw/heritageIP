"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendBackerInterest } from "@/lib/backers";
import { db } from "@/lib/db";
import { requireOwnedHubId } from "@/lib/hubs";
import { mentionsTerms, NO_TERMS_MESSAGE } from "@/lib/no-terms";
import { FOCUS_AREAS } from "@/lib/profile-schema";
import { requireOnboarded } from "@/lib/session";

const discovery = z.object({
  discoverable: z.boolean(),
  sector: z.enum(FOCUS_AREAS).nullable(),
  backerAsk: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
});

export async function setDiscovery(hubId: string, input: z.input<typeof discovery>) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  const parsed = discovery.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.discoverable && !hub.thesis) return { ok: false as const, message: "Save a thesis first. It's what backers read." };
  if (d.discoverable && !d.sector) return { ok: false as const, message: "Pick a sector so the right backers find you." };
  const terms = d.backerAsk ? mentionsTerms(d.backerAsk) : null;
  if (terms) return { ok: false as const, message: NO_TERMS_MESSAGE(terms) };
  await db.hub.update({
    where: { id: hub.id },
    data: {
      ...d,
      discoverableAt: d.discoverable ? (hub.discoverableAt ?? new Date()) : null,
    },
  });
  revalidatePath(`/hubs/${hub.slug}`, "layout");
  revalidatePath("/backers");
  return { ok: true as const };
}

const interest = z.object({
  hubId: z.string().min(1),
  note: z.string().trim().min(20, "Say why this hub, and what you'd bring beyond money.").max(1000),
});

export async function signalBackerInterest(hubId: string, note: string) {
  const viewer = await requireOnboarded();
  const parsed = interest.safeParse({ hubId, note });
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const terms = mentionsTerms(parsed.data.note);
  if (terms) return { ok: false as const, message: NO_TERMS_MESSAGE(terms) };
  const res = await sendBackerInterest(viewer, parsed.data.hubId, parsed.data.note);
  revalidatePath("/", "layout");
  return res;
}
