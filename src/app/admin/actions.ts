"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, setHubFeatured, setPartnerFeatured, setPartnerManager } from "@/lib/admin";

const featureInput = z.object({ id: z.string().min(1), featured: z.enum(["true", "false"]) });

export async function toggleHubFeatured(form: FormData) {
  await requireAdmin();
  const input = featureInput.safeParse(Object.fromEntries(form));
  if (!input.success) return;
  await setHubFeatured(input.data.id, input.data.featured === "true");
  revalidatePath("/admin", "layout");
  revalidatePath("/roles");
  revalidatePath("/backers");
}

export async function togglePartnerFeatured(form: FormData) {
  await requireAdmin();
  const input = featureInput.safeParse(Object.fromEntries(form));
  if (!input.success) return;
  await setPartnerFeatured(input.data.id, input.data.featured === "true");
  revalidatePath("/admin", "layout");
  revalidatePath("/partners");
}

const managerInput = z.object({ id: z.string().min(1), userId: z.string() });

export async function assignPartnerManager(form: FormData) {
  await requireAdmin();
  const input = managerInput.safeParse(Object.fromEntries(form));
  if (!input.success) return;
  await setPartnerManager(input.data.id, input.data.userId || null);
  revalidatePath("/admin", "layout");
  revalidatePath("/connections");
}
