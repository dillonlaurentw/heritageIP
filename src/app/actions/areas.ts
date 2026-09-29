"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAreaKey } from "@/lib/areas";
import { proposeAreaSection, saveAreaSection } from "@/lib/areas-data";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";

const id = z.string().min(1).max(64);
const input = z.object({ workspaceId: id, area: z.string().refine(isAreaKey, "Unknown area"), section: z.string().min(1).max(40) });

async function ws(workspaceId: string) {
  return db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { id: true, slug: true, name: true } });
}

/** A draft of one section of an area's page. Saves nothing. */
export async function draftAreaSection(workspaceId: string, area: string, section: string, steer?: string) {
  const viewer = await requireOnboarded();
  const p = input.parse({ workspaceId, area, section });
  if (!isAreaKey(p.area)) return { ok: false as const, message: "Unknown area." };
  return proposeAreaSection(viewer, await ws(p.workspaceId), p.area, p.section, z.string().max(300).optional().parse(steer)?.trim() || undefined);
}

/** "Use this" / "Save": writes the section into the area's page. */
export async function keepAreaSection(workspaceId: string, area: string, section: string, text: string) {
  const viewer = await requireOnboarded();
  const p = input.parse({ workspaceId, area, section });
  if (!isAreaKey(p.area)) return { ok: false as const, message: "Unknown area." };
  const w = await ws(p.workspaceId);
  const res = await saveAreaSection(viewer, w, p.area, p.section, z.string().max(8000).parse(text));
  revalidatePath(`/w/${w.slug}/areas`, "layout");
  return res;
}
