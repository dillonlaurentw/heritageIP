"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwnedHubId } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";
import { roleInput, type RoleInput } from "@/lib/role-schema";

export async function postRole(hubId: string, input: RoleInput) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  const parsed = roleInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const { planStepId, ...data } = parsed.data;
  // Only link a step that belongs to this hub.
  const step = planStepId ? await db.planStep.findFirst({ where: { id: planStepId, hubId } }) : null;
  await db.roleOpening.create({ data: { hubId, ...data, planStepId: step?.id ?? null } });
  revalidatePath(`/hubs/${hub.slug}/team`);
  revalidatePath("/roles");
  return { ok: true as const };
}

export async function setRoleStatus(roleId: string, status: "OPEN" | "FILLED" | "CLOSED") {
  const viewer = await requireOnboarded();
  const role = await db.roleOpening.findUnique({ where: { id: roleId }, include: { hub: true } });
  if (!role || role.hub.ownerId !== viewer.user.id) throw new Error("Not your role.");
  await db.roleOpening.update({ where: { id: roleId }, data: { status: z.enum(["OPEN", "FILLED", "CLOSED"]).parse(status) } });
  revalidatePath(`/hubs/${role.hub.slug}/team`);
  revalidatePath("/roles");
}
