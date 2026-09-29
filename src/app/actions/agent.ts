"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";

/** Opt in or out of simulations. Opting out stops any running simulation that includes you. */
export async function setSimOptIn(on: boolean) {
  const viewer = await requireOnboarded();
  await db.profile.update({ where: { userId: viewer.user.id }, data: { simOptIn: z.boolean().parse(on), simOptInAt: on ? new Date() : null } });
  revalidatePath("/me/self");
  revalidatePath("/simulations", "layout");
}
