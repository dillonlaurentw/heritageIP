"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, setPartnerFeatured, setPartnerManager, setWorkspaceFeatured } from "@/lib/admin";
import { reviewApplication } from "@/lib/app/access";

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

/** Say yes (they join a circle and get invites) or no to someone who applied to the app. */
export async function answerApplication(applicationId: string, approve: boolean) {
  await requireAdmin();
  const res = await reviewApplication(id.parse(applicationId), z.boolean().parse(approve));
  revalidatePath("/admin/applications");
  return res;
}
