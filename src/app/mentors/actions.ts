"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requestMentor } from "@/lib/mentors";
import { requireOnboarded } from "@/lib/session";

const request = z.object({
  mentorId: z.string().min(1),
  hubId: z.string().min(1, "Pick the hub this is for."),
  planStepId: z.string().nullable(),
  note: z.string().trim().min(20, "Say what you're stuck on and what would help.").max(1000),
});

export async function askForMentor(input: z.input<typeof request>) {
  const viewer = await requireOnboarded();
  const parsed = request.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const res = await requestMentor({ fromUserId: viewer.user.id, ...parsed.data });
  revalidatePath("/", "layout");
  return res;
}

/** Mentors pause or resume new requests. */
export async function setMentorOpen(open: boolean) {
  const viewer = await requireOnboarded();
  if (!viewer.profile.roles.includes("MENTOR")) return;
  await db.profile.update({ where: { userId: viewer.user.id }, data: { mentorOpen: open } });
  revalidatePath("/mentors", "layout");
}
