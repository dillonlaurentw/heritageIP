"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { personaAgent, runAgent } from "@/agents";
import { builderContext } from "@/lib/builder";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";

/** Save the persona text your agent is given. Empty resets to a restatement of your answers. */
export async function savePersona(text: string) {
  const viewer = await requireOnboarded();
  const parsed = z.string().trim().max(2000, "Keep it under 2,000 characters.").safeParse(text);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  await db.profile.update({ where: { userId: viewer.user.id }, data: { persona: parsed.data || null, personaUpdatedAt: new Date() } });
  revalidatePath("/me/agent");
  return { ok: true as const };
}

/** Ask SELF to rebuild the persona from your answers. A proposal only; you choose whether to save it. */
export async function proposePersona() {
  const viewer = await requireOnboarded();
  return runAgent(personaAgent, { builder: builderContext(viewer) }, { userId: viewer.user.id });
}

/** Opt in or out of simulations. Opting out stops any running simulation that includes you. */
export async function setSimOptIn(on: boolean) {
  const viewer = await requireOnboarded();
  await db.profile.update({ where: { userId: viewer.user.id }, data: { simOptIn: z.boolean().parse(on), simOptInAt: on ? new Date() : null } });
  revalidatePath("/me/agent");
  revalidatePath("/simulations", "layout");
}
