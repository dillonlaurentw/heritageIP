"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PaletteItem } from "@/components/shell/types";
import {
  archivePage,
  createPage,
  deleteForever,
  duplicatePage,
  movePage,
  pageHref,
  restorePage,
  searchPages,
  updatePage,
} from "@/lib/pages";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";

const id = z.string().min(1).max(64);
type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

async function attempt<T extends object>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function newPage(workspaceId: string, parentId: string | null, title = ""): Promise<Result<{ href: string }>> {
  const viewer = await requireOnboarded();
  const input = z.object({ workspaceId: id, parentId: id.nullable(), title: z.string().max(200) }).parse({ workspaceId, parentId, title });
  return attempt(async () => {
    const page = await createPage(input, viewer);
    const ws = await db.workspace.findUniqueOrThrow({ where: { id: page.workspaceId }, select: { slug: true } });
    revalidatePath("/", "layout");
    return { href: pageHref(ws.slug, page.id) };
  });
}

const patchSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().max(16).nullable().optional(),
  coverUrl: z.string().max(500).nullable().optional(),
  content: z.array(z.unknown()).max(5000).optional(),
  fullWidth: z.boolean().optional(),
});

export async function savePage(pageId: string, patch: z.infer<typeof patchSchema>): Promise<Result> {
  const viewer = await requireOnboarded();
  const data = patchSchema.parse(patch);
  return attempt(async () => {
    await updatePage(id.parse(pageId), data, viewer);
    // Titles and icons show in the sidebar; content-only saves don't need a refresh.
    if (data.title !== undefined || data.icon !== undefined) revalidatePath("/", "layout");
    return {};
  });
}

export async function movePageAction(dragId: string, targetId: string, where: "before" | "inside" | "after"): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await movePage(id.parse(dragId), id.parse(targetId), z.enum(["before", "inside", "after"]).parse(where), viewer);
    revalidatePath("/", "layout");
    return {};
  });
}

export async function archivePageAction(pageId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await archivePage(id.parse(pageId), viewer);
    revalidatePath("/", "layout");
    return {};
  });
}

export async function restorePageAction(pageId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await restorePage(id.parse(pageId), viewer);
    revalidatePath("/", "layout");
    return {};
  });
}

export async function deleteForeverAction(pageId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await deleteForever(id.parse(pageId), viewer);
    revalidatePath("/", "layout");
    return {};
  });
}

export async function duplicatePageAction(pageId: string): Promise<Result<{ href: string }>> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    const copy = await duplicatePage(id.parse(pageId), viewer);
    const ws = await db.workspace.findUniqueOrThrow({ where: { id: copy.workspaceId }, select: { slug: true } });
    revalidatePath("/", "layout");
    return { href: pageHref(ws.slug, copy.id) };
  });
}

/** ⌘K results: pages in every workspace you belong to. */
export async function searchPalette(q: string): Promise<PaletteItem[]> {
  const viewer = await requireOnboarded();
  const pages = await searchPages(viewer, z.string().max(100).parse(q).trim());
  return pages.map((p) => ({
    id: `page:${p.id}`,
    label: p.title || "Untitled",
    group: q ? "Pages" : "Recent",
    href: pageHref(p.workspace.slug, p.id),
    icon: p.icon,
    hint: [p.workspace.kind === "PERSONAL" ? "Private" : p.workspace.name, p.parent?.kind === "DATABASE" ? p.parent.title : null]
      .filter(Boolean)
      .join(" · "),
  }));
}
