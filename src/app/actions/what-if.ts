"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { applyWhatIfChanges, runWhatIf } from "@/lib/what-if";

const id = z.string().min(1).max(64);

async function ws(workspaceId: string) {
  return db.workspace.findUniqueOrThrow({ where: { id: id.parse(workspaceId) }, select: { id: true, slug: true } });
}

export async function checkWhatIf(workspaceId: string, scenario: string) {
  const viewer = await requireOnboarded();
  const w = await ws(workspaceId);
  const res = await runWhatIf(viewer, w, z.string().max(2000).parse(scenario));
  revalidatePath(`/w/${w.slug}/what-if`);
  return res;
}

export async function addWhatIfChanges(workspaceId: string, checkId: string, picked: number[]) {
  const viewer = await requireOnboarded();
  const w = await ws(workspaceId);
  const res = await applyWhatIfChanges(viewer, w, id.parse(checkId), z.array(z.number().int()).max(10).parse(picked));
  revalidatePath("/", "layout");
  return res;
}
