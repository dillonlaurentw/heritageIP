"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboarded } from "@/lib/session";
import { actOnSignal, sendRoleInterest } from "@/lib/signals";

export async function respondToSignal(signalId: string, action: "accept" | "decline" | "withdraw") {
  const viewer = await requireOnboarded();
  const res = await actOnSignal(signalId, viewer.user.id, z.enum(["accept", "decline", "withdraw"]).parse(action));
  revalidatePath("/", "layout");
  return res;
}

const interest = z.object({
  roleId: z.string().min(1),
  note: z.string().trim().min(20, "Say a bit more. What would you bring?").max(1000),
});

export async function signalInterest(roleId: string, note: string) {
  const viewer = await requireOnboarded();
  if (!viewer.profile.roles.includes("BUILDER")) {
    return { ok: false as const, message: "Only builders can join teams. Add the Builder role on your profile." };
  }
  const parsed = interest.safeParse({ roleId, note });
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const res = await sendRoleInterest(viewer.user.id, parsed.data.roleId, parsed.data.note);
  revalidatePath("/", "layout");
  return res;
}
