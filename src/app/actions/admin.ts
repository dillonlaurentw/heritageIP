"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, setPartnerFeatured, setPartnerManager, setWorkspaceFeatured } from "@/lib/admin";

const id = z.string().min(1).max(64);

export async function featureWorkspace(workspaceId: string, featured: boolean) {
  await requireAdmin();
  await setWorkspaceFeatured(id.parse(workspaceId), z.boolean().parse(featured));
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function featurePartner(partnerId: string, featured: boolean) {
  await requireAdmin();
  await setPartnerFeatured(id.parse(partnerId), z.boolean().parse(featured));
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function linkPartnerManager(partnerId: string, userId: string | null) {
  await requireAdmin();
  const res = await setPartnerManager(id.parse(partnerId), userId ? id.parse(userId) : null);
  revalidatePath("/", "layout");
  return res;
}
