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
  const { user, profile } = await requireViewer();
  // No contact screen any more: until they add one, a yes shares their sign-in email.
  await db.profile.update({ where: { userId: user.id }, data: { onboardedAt: new Date(), contactEmail: profile.contactEmail ?? user.email } });
  // A builder goes straight to naming what they just described; everyone else to Today.
  const hasCompany = await db.workspaceMember.count({ where: { userId: user.id, workspace: { kind: "TEAM" } } });
  redirect(profile.roles.includes("BUILDER") && !hasCompany && profile.buildingToward ? "/new" : "/home");
}
