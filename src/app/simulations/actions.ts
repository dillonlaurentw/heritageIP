"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOnboarded } from "@/lib/session";
import { finishSimulation, runNextTurn, startSimulation } from "@/lib/simulations";

const input = z.object({
  participantIds: z.array(z.string()).max(4),
  scenarioKey: z.string().min(1),
  customTitle: z.string().trim().max(80).optional(),
  customBrief: z.string().trim().max(800).optional(),
  hubId: z.string().nullable(),
  maxTurns: z.number().int(),
});

export async function createSimulation(raw: z.input<typeof input>) {
  const viewer = await requireOnboarded();
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Check the form and try again." };
  const res = await startSimulation(viewer, parsed.data);
  if (!res.ok) return res;
  redirect(`/simulations/${res.id}`);
}

export async function nextTurn(simId: string) {
  const viewer = await requireOnboarded();
  return runNextTurn(simId, viewer);
}

export async function writeReport(simId: string) {
  const viewer = await requireOnboarded();
  return finishSimulation(simId, viewer);
}
