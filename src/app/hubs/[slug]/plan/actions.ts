"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gamePlanAgent, runAgent } from "@/agents";
import { db } from "@/lib/db";
import { builderContext, requireOwnedHubId } from "@/lib/hubs";
import { NEED_TAGS } from "@/lib/needs";
import { listSteps } from "@/lib/plan";
import { move, normalize, STAGES } from "@/lib/plan-order";
import { requireOnboarded, type Viewer } from "@/lib/session";

const stepInput = z.object({
  stage: z.enum(STAGES),
  title: z.string().trim().min(1, "A step needs a title.").max(120),
  detail: z
    .string()
    .trim()
    .max(600)
    .transform((v) => v || null),
  needs: z.array(z.enum(NEED_TAGS)).max(NEED_TAGS.length),
});
export type StepInput = z.input<typeof stepInput>;

/** Load a step and check the viewer owns its hub. */
async function ownedStep(stepId: string, viewer: Viewer) {
  const step = await db.planStep.findUnique({ where: { id: stepId }, include: { hub: true } });
  if (!step || step.hub.ownerId !== viewer.user.id) throw new Error("Not your step.");
  return step;
}

async function done(hubId: string, slug: string) {
  revalidatePath(`/hubs/${slug}`);
  return { ok: true as const, steps: await listSteps(hubId) };
}

async function endOfStage(hubId: string, stage: (typeof STAGES)[number]) {
  return db.planStep.count({ where: { hubId, stage } });
}

/**
 * Generate (or regenerate) the plan. Done steps are always kept; everything
 * not done is replaced with the agent's new plan.
 */
export async function generatePlan(hubId: string) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  if (!hub.thesis) return { ok: false as const, message: "Save a thesis first. The plan is built from it." };

  const kept = await db.planStep.findMany({ where: { hubId, doneAt: { not: null } } });
  const res = await runAgent(
    gamePlanAgent,
    { builder: builderContext(viewer), hubName: hub.name, thesis: hub.thesis, done: kept.map((s) => s.title) },
    { userId: viewer.user.id, hubId },
  );
  if (!res.ok) return res;

  const counters = new Map(STAGES.map((st) => [st, kept.filter((k) => k.stage === st).length]));
  await db.$transaction([
    db.planStep.deleteMany({ where: { hubId, doneAt: null } }),
    db.planStep.createMany({
      data: res.output.steps.slice(0, 20).map((s) => {
        const position = counters.get(s.stage)!;
        counters.set(s.stage, position + 1);
        return {
          hubId,
          stage: s.stage,
          position,
          title: s.title.slice(0, 120),
          detail: s.detail.slice(0, 600),
          needs: [...new Set(s.needs)],
          source: "AGENT" as const,
        };
      }),
    }),
    db.hub.update({
      where: { id: hubId },
      data: { stage: hub.stage === "IDEA" || hub.stage === "THESIS" ? "PLAN" : hub.stage },
    }),
  ]);
  return { ...(await done(hubId, hub.slug)), demo: res.demo };
}

export async function toggleDone(stepId: string) {
  const viewer = await requireOnboarded();
  const step = await ownedStep(stepId, viewer);
  await db.planStep.update({ where: { id: step.id }, data: { doneAt: step.doneAt ? null : new Date() } });
  return done(step.hubId, step.hub.slug);
}

export async function addStep(hubId: string, input: StepInput) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  const parsed = stepInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  await db.planStep.create({
    data: { hubId, ...parsed.data, position: await endOfStage(hubId, parsed.data.stage), source: "MANUAL" },
  });
  if (hub.stage === "IDEA" || hub.stage === "THESIS") await db.hub.update({ where: { id: hubId }, data: { stage: "PLAN" } });
  return done(hubId, hub.slug);
}

export async function updateStep(stepId: string, input: StepInput) {
  const viewer = await requireOnboarded();
  const step = await ownedStep(stepId, viewer);
  const parsed = stepInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const movedStage = parsed.data.stage !== step.stage;
  await db.planStep.update({
    where: { id: step.id },
    data: {
      ...parsed.data,
      // Changing stage drops the step at the end of its new stage.
      ...(movedStage && { position: await endOfStage(step.hubId, parsed.data.stage) }),
    },
  });
  if (movedStage) await renumber(step.hubId);
  return done(step.hubId, step.hub.slug);
}

export async function deleteStep(stepId: string) {
  const viewer = await requireOnboarded();
  const step = await ownedStep(stepId, viewer);
  await db.planStep.delete({ where: { id: step.id } });
  await renumber(step.hubId);
  return done(step.hubId, step.hub.slug);
}

export async function moveStep(stepId: string, dir: "up" | "down") {
  const viewer = await requireOnboarded();
  const step = await ownedStep(stepId, viewer);
  const all = await db.planStep.findMany({ where: { hubId: step.hubId }, select: { id: true, stage: true, position: true } });
  await write(all, move(all, step.id, dir));
  return done(step.hubId, step.hub.slug);
}

/** Close gaps in positions after a delete or stage change. */
async function renumber(hubId: string) {
  const all = await db.planStep.findMany({ where: { hubId }, select: { id: true, stage: true, position: true } });
  await write(all, normalize(all));
}

/** Persist only the rows whose stage or position actually changed. */
async function write(
  before: { id: string; stage: (typeof STAGES)[number]; position: number }[],
  after: { id: string; stage: (typeof STAGES)[number]; position: number }[],
) {
  const prev = new Map(before.map((s) => [s.id, s]));
  const changed = after.filter((s) => prev.get(s.id)?.stage !== s.stage || prev.get(s.id)?.position !== s.position);
  if (changed.length) {
    await db.$transaction(
      changed.map((s) => db.planStep.update({ where: { id: s.id }, data: { stage: s.stage, position: s.position } })),
    );
  }
}
