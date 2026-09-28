"use server";

import { revalidatePath } from "next/cache";
import { saveProfileFields, type SaveResult } from "@/lib/profile";
import type { ProfileInput } from "@/lib/profile-schema";
import { requireOnboarded } from "@/lib/session";

/** Save any subset of profile fields (validated in saveProfileFields). */
export async function saveProfile(fields: Partial<ProfileInput>): Promise<SaveResult> {
  const viewer = await requireOnboarded();
  const res = await saveProfileFields(viewer.user.id, fields);
  if (res.ok) revalidatePath("/", "layout");
  return res;
}
