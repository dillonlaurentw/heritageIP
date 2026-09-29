"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureSystemDb } from "@/lib/databases";
import { db } from "@/lib/db";
import { createPage, pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { templateByKey } from "@/lib/templates";
import { requireWorkspaceRole } from "@/lib/workspaces";

/**
 * Make something from a template and return where it lives. One-per-workspace
 * templates (Go-to-market, built-in databases) open the existing one if it's there.
 */
export async function createFromTemplate(
  workspaceId: string,
  key: string,
  parentId: string | null = null,
): Promise<{ ok: true; href: string } | { ok: false; message: string }> {
  const viewer = await requireOnboarded();
  const wsId = z.string().min(1).max(64).parse(workspaceId);
  const tpl = templateByKey(z.string().max(40).parse(key));
  if (!tpl) return { ok: false, message: "That template doesn't exist." };
  try {
    await requireWorkspaceRole(wsId, viewer, "MEMBER");
    const ws = await db.workspace.findUniqueOrThrow({ where: { id: wsId }, select: { slug: true } });
    if (tpl.kind === "flow") return { ok: true, href: `/w/${ws.slug}/${tpl.path}` };
    if (tpl.kind === "database") {
      const page = await ensureSystemDb(wsId, tpl.db, viewer.user.id, parentId);
      revalidatePath("/", "layout");
      return { ok: true, href: pageHref(ws.slug, page.id) };
    }
    if (tpl.systemKey) {
      const existing = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: wsId, systemKey: tpl.systemKey } } });
      if (existing && !existing.archivedAt) return { ok: true, href: pageHref(ws.slug, existing.id) };
      if (existing) await db.page.delete({ where: { id: existing.id } });
    }
    const page = await createPage(
      { workspaceId: wsId, parentId, title: tpl.title, icon: tpl.icon, content: tpl.blocks(), template: tpl.key, systemKey: tpl.systemKey ?? null },
      viewer,
    );
    revalidatePath("/", "layout");
    return { ok: true, href: pageHref(ws.slug, page.id) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't create that." };
  }
}
