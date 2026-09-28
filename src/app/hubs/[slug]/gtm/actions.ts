"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gtmAgent, runAgent } from "@/agents";
import { db } from "@/lib/db";
import { GTM_SECTIONS } from "@/lib/gtm-sections";
import { builderContext, requireOwnedHubId } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";

const section = z.enum(GTM_SECTIONS);

/** Ask the GTM agent for a proposal. Nothing is saved until the builder says so. */
export async function proposeSection(hubId: string, which: string, mode: "draft" | "sharpen") {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  if (!hub.thesis) return { ok: false as const, message: "Save a thesis first. The workspace is built from it." };
  const s = section.parse(which);
  const [workspace, steps] = await Promise.all([
    db.gtmWorkspace.findUnique({ where: { hubId } }),
    db.planStep.findMany({
      where: { hubId, doneAt: null, OR: [{ needs: { has: "MARKETING" } }, { needs: { has: "GTM" } }] },
      select: { title: true },
    }),
  ]);
  return runAgent(
    gtmAgent,
    {
      builder: builderContext(viewer),
      hubName: hub.name,
      thesis: hub.thesis,
      section: s,
      mode: mode === "sharpen" && workspace?.[s]?.trim() ? "sharpen" : "draft",
      workspace: {
        positioning: workspace?.positioning,
        customers: workspace?.customers,
        channels: workspace?.channels,
        launchPlan: workspace?.launchPlan,
      },
      gtmSteps: steps.map((st) => st.title),
    },
    { userId: viewer.user.id, hubId },
  );
}

export async function saveSection(hubId: string, which: string, content: string) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  const s = section.parse(which);
  const text = z.string().max(6000, "Keep it under 6,000 characters.").safeParse(content.trim());
  if (!text.success) return { ok: false as const, message: text.error.issues[0].message };
  const value = text.data || null;
  await db.gtmWorkspace.upsert({ where: { hubId }, create: { hubId, [s]: value }, update: { [s]: value } });
  revalidatePath(`/hubs/${hub.slug}`, "layout");
  return { ok: true as const };
}
