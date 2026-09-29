import type { Metadata } from "next";
import type { Route } from "next";
import { Screen } from "@/components/shell/Screen";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { canManage, invitableRoles } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { PeopleManager } from "./PeopleManager";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage({
  params,
  searchParams,
}: {
  params: Promise<{ ws: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const manage = canManage(role);
  const [members, invites] = await Promise.all([
    db.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ joinedAt: "asc" }],
      select: {
        role: true,
        title: true,
        joinedAt: true,
        user: {
          // Login email only for people who manage the workspace (they invited by email).
          select: { id: true, name: true, email: manage, profile: { select: { headline: true, focusAreas: true } } },
        },
      },
    }),
    manage
      ? db.invite.findMany({
          where: { workspaceId: workspace.id, acceptedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
        })
      : [],
  ]);

  // What each person is working on: open tasks assigned to them.
  const tasksDb = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: workspace.id, systemKey: "tasks" } }, select: { id: true, archivedAt: true } });
  const openTasks: Record<string, number> = {};
  if (tasksDb && !tasksDb.archivedAt) {
    const rows = await db.page.findMany({ where: { parentId: tasksDb.id, kind: "ROW", archivedAt: null }, select: { props: true } });
    for (const r of rows) {
      const p = (r.props ?? {}) as { status?: unknown; assignee?: unknown };
      if (p.status === "done" || !Array.isArray(p.assignee)) continue;
      for (const id of p.assignee) if (typeof id === "string") openTasks[id] = (openTasks[id] ?? 0) + 1;
    }
  }

  return (
    <Screen
      crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` as Route }, { label: "People" }]}
      title="People"
      description={`Everyone in ${workspace.name}, and what they can do.`}
    >
      <PeopleManager
        workspaceId={workspace.id}
        me={{ id: viewer.user.id, role }}
        canInvite={manage}
        invitable={invitableRoles(role)}
        openInvite={(await searchParams).invite === "1" && manage}
        members={members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: "email" in m.user ? (m.user.email as string) : null,
          headline: m.user.profile?.headline ?? null,
          focusAreas: m.user.profile?.focusAreas ?? [],
          openTasks: openTasks[m.user.id] ?? 0,
          role: m.role,
          title: m.title,
          joinedAt: m.joinedAt.toISOString(),
        }))}
        tasksHref={tasksDb && !tasksDb.archivedAt ? `/w/${workspace.slug}/${tasksDb.id}` : null}
        invites={invites.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), expired: i.expiresAt < new Date() }))}
      />
    </Screen>
  );
}
