import "server-only";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { DEMO_EMAIL_DOMAIN, demoLoginEnabled } from "@/lib/demo";
import { unreadConversations } from "@/lib/messages";
import { loadTree } from "@/lib/pages";
import { rolesLine } from "@/lib/roles";
import { getViewer } from "@/lib/session";
import { canEdit } from "@/lib/workspace-rules";
import { ensurePersonalWorkspace, lastWorkspaceSlug, listWorkspaces } from "@/lib/workspaces";
import { ShellClient } from "./ShellClient";

/**
 * The signed-in frame: sidebar, command palette and content. `slug` is the
 * workspace in the URL; elsewhere the sidebar shows the last one visited.
 */
export async function AppShell({ slug, children }: { slug?: string; children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.profile.onboardedAt) redirect("/onboarding");

  const [personal, workspaces] = await Promise.all([ensurePersonalWorkspace(viewer), listWorkspaces(viewer.user.id)]);
  const currentSlug = slug && slug !== personal.slug ? slug : await lastWorkspaceSlug(viewer.user.id);
  const current = workspaces.find((w) => w.slug === currentSlug) ?? null;

  const [tree, privateTree, inboxCount, demoUsers, unread] = await Promise.all([
    current ? loadTree(current.id, current.slug) : [],
    loadTree(personal.id, personal.slug),
    db.notification.count({ where: { userId: viewer.user.id, readAt: null } }),
    demoLoginEnabled()
      ? db.user.findMany({
          where: { email: { endsWith: DEMO_EMAIL_DOMAIN }, profile: { onboardedAt: { not: null } } },
          orderBy: { name: "asc" },
          select: { email: true, name: true, profile: { select: { roles: true } } },
        })
      : [],
    unreadConversations(viewer.user.id),
  ]);

  return (
    <ShellClient
      user={{ name: viewer.user.name, email: viewer.user.email, isAdmin: viewer.profile.roles.includes("ADMIN") }}
      workspaces={workspaces.map((w) => ({ slug: w.slug, name: w.name, icon: w.icon }))}
      current={current ? { slug: current.slug, name: current.name, icon: current.icon, id: current.id } : null}
      personal={{ slug: personal.slug, id: personal.id }}
      tree={tree}
      privateTree={privateTree}
      inboxCount={inboxCount}
      messagesCount={unread}
      canEdit={canEdit(current?.role)}
      signOut={signOut}
      demoUsers={demoUsers.map((u) => ({ email: u.email, name: u.name, roles: rolesLine(u.profile?.roles ?? []) }))}
    >
      {children}
    </ShellClient>
  );
}
