"use server";

import { revalidatePath } from "next/cache";
import { saveProfileFields } from "@/lib/profile";
import type { ProfileInput } from "@/lib/profile-schema";
import { requireViewer } from "@/lib/session";

export async function updateProfile(input: ProfileInput) {
  const { user } = await requireViewer();
  const res = await saveProfileFields(user.id, input);
  if (res.ok) revalidatePath("/", "layout");
  return res;
}
