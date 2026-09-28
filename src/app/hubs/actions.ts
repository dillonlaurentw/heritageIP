"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ideasAgent, runAgent } from "@/agents";
import { COVER_LAYOUTS, COVER_TONES } from "@/components/mosaic/CoverArt";
import { db } from "@/lib/db";
import { builderContext, requireOwnedHubId, uniqueSlug } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";
import { storeImage } from "@/lib/storage";

const newHub = z.object({
  name: z.string().trim().min(1, "Give it a working name. You can change it.").max(60),
  rawIdea: z.string().trim().min(12, "Say a little more. A sentence or two is plenty.").max(2000),
  oneLiner: z.string().trim().max(140).optional(),
});

export type CreateState = { errors?: Record<string, string> };

async function create(userId: string, data: z.infer<typeof newHub>) {
  const hub = await db.hub.create({
    data: {
      ownerId: userId,
      slug: await uniqueSlug(data.name),
      name: data.name,
      rawIdea: data.rawIdea,
      oneLiner: data.oneLiner || null,
    },
  });
  redirect(`/hubs/${hub.slug}/thesis`);
}

export async function createHub(_prev: CreateState, form: FormData): Promise<CreateState> {
  const viewer = await requireOnboarded();
  const parsed = newHub.safeParse({ name: form.get("name"), rawIdea: form.get("rawIdea") });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  await create(viewer.user.id, parsed.data);
  return {};
}

export async function generateIdeas(steer: string) {
  const viewer = await requireOnboarded();
  return runAgent(
    ideasAgent,
    { builder: builderContext(viewer), steer: steer.trim().slice(0, 300) || undefined },
    { userId: viewer.user.id },
  );
}

export async function createHubFromIdea(idea: { name: string; oneLiner: string; seed: string }) {
  const viewer = await requireOnboarded();
  const data = newHub.parse({ name: idea.name, rawIdea: idea.seed, oneLiner: idea.oneLiner });
  await create(viewer.user.id, data);
}

const hubDetails = z.object({
  name: z.string().trim().min(1).max(60),
  oneLiner: z
    .string()
    .trim()
    .max(140)
    .transform((v) => v || null),
  coverLayout: z.enum(COVER_LAYOUTS as [string, ...string[]]).nullable(),
  coverTone: z.enum(COVER_TONES as [string, ...string[]]).nullable(),
});

export async function updateHub(hubId: string, input: z.input<typeof hubDetails>) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  const parsed = hubDetails.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  await db.hub.update({ where: { id: hub.id }, data: parsed.data });
  revalidatePath(`/hubs/${hub.slug}`);
  return { ok: true as const };
}

export async function uploadCover(hubId: string, form: FormData) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  const file = form.get("cover");
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, message: "Pick an image first." };
  try {
    const url = await storeImage(file, `covers/${hub.id}`);
    await db.hub.update({ where: { id: hub.id }, data: { coverImageUrl: url } });
    revalidatePath(`/hubs/${hub.slug}`);
    return { ok: true as const, url };
  } catch (e) {
    return { ok: false as const, message: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function removeCoverImage(hubId: string) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  await db.hub.update({ where: { id: hub.id }, data: { coverImageUrl: null } });
  revalidatePath(`/hubs/${hub.slug}`);
}

export async function deleteHub(hubId: string) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  await db.hub.delete({ where: { id: hub.id } });
  redirect("/hubs");
}
