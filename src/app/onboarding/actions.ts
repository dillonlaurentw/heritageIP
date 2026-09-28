"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { saveProfileFields, type SaveResult } from "@/lib/profile";
import type { ProfileInput } from "@/lib/profile-schema";
import { requireViewer } from "@/lib/session";

/** Save one onboarding screen and remember where the person is. */
export async function saveStep(fields: Partial<ProfileInput>, nextStep: number): Promise<SaveResult> {
  const { user } = await requireViewer();
  const res = await saveProfileFields(user.id, fields);
  if (res.ok) await db.profile.update({ where: { userId: user.id }, data: { onboardingStep: nextStep } });
  return res;
}

export async function completeOnboarding() {
  const { user } = await requireViewer();
  await db.profile.update({ where: { userId: user.id }, data: { onboardedAt: new Date() } });
  redirect("/home");
}
