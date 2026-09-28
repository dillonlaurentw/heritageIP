import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { WorkspaceRole } from "@/generated/prisma/enums";
import { db } from "./db";
import type { Viewer } from "./session";
import { atLeast } from "./workspace-rules";

export const LAST_WS_COOKIE = "self-ws";
const INVITE_DAYS = 14;

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace"
  );
}

export async function uniqueWorkspaceSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; await db.workspace.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
  return slug;
}

/** Every person has one private workspace for pages only they can see. */
export const ensurePersonalWorkspace = cache(async (viewer: Viewer) => {
  const existing = await db.workspace.findFirst({
    where: { kind: "PERSONAL", createdById: viewer.user.id },
    select: { id: true, slug: true, name: true, icon: true },
  });
  if (existing) return existing;
  return db.workspace.create({
    data: {
      kind: "PERSONAL",
      slug: await uniqueWorkspaceSlug(`private-${viewer.user.name || "me"}`),
      name: "Private",
      createdById: viewer.user.id,
      members: { create: { userId: viewer.user.id, role: "OWNER" } },
    },
    select: { id: true, slug: true, name: true, icon: true },
  });
});

/** Team workspaces the person belongs to, oldest first. */
export const listWorkspaces = cache(async (userId: string) => {
  const rows = await db.workspaceMember.findMany({
    where: { userId, workspace: { kind: "TEAM" } },
    orderBy: { joinedAt: "asc" },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          slug: true,
          name: true,
          icon: true,
          oneLiner: true,
          stage: true,
          _count: { select: { members: true } },
        },
      },
    },
  });
  return rows.map((r) => ({ ...r.workspace, role: r.role, memberCount: r.workspace._count.members }));
});

/** The team workspace the person was last in, else their first. */
export async function lastWorkspaceSlug(userId: string) {
  const all = await listWorkspaces(userId);
  const saved = (await cookies()).get(LAST_WS_COOKIE)?.value;
  return (all.find((w) => w.slug === saved) ?? all[0])?.slug ?? null;
}

export type WorkspaceAccess = Awaited<ReturnType<typeof getWorkspaceAccess>>;

/**
 * Pages: load a workspace the viewer belongs to. Anyone else gets a 404,
 * never a "forbidden", so workspaces don't reveal that they exist.
 */
export const getWorkspaceAccess = cache(async (slug: string, viewer: Viewer) => {
  const workspace = await db.workspace.findUnique({ where: { slug } });
  if (!workspace) notFound();
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: viewer.user.id } },
    select: { role: true },
  });
  if (!member) notFound();
  return { workspace, role: member.role as WorkspaceRole };
});

/** Actions: check the viewer's role in a workspace by id. Throws if too low. */
export async function requireWorkspaceRole(workspaceId: string, viewer: Viewer, min: WorkspaceRole) {
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: viewer.user.id } },
    select: { role: true },
  });
  if (!member || !atLeast(member.role, min)) throw new Error("Not allowed.");
  return member.role as WorkspaceRole;
}

export async function roleIn(workspaceId: string, userId: string) {
  const m = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  return (m?.role ?? null) as WorkspaceRole | null;
}

export async function logActivity(workspaceId: string, actorId: string, kind: string, pageId?: string | null, data?: object) {
  await db.activity.create({ data: { workspaceId, actorId, kind, pageId: pageId ?? null, data: data ?? undefined } });
}

export function newInviteToken() {
  return randomBytes(24).toString("base64url");
}

export const inviteExpiry = () => new Date(Date.now() + INVITE_DAYS * 86_400_000);
