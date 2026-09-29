import { LayoutTemplate, Settings, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Screen } from "@/components/shell/Screen";
import { AvatarStack } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { PageIcon, WorkspaceMark } from "@/components/ui/PageIcon";
import { db } from "@/lib/db";
import { pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { canEdit, canManage } from "@/lib/workspace-rules";
import { Journey, journeyFor } from "./Journey";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { ActivityFeed } from "./ActivityFeed";
import { CompanyTiles } from "./CompanyTiles";
import { TEMPLATES } from "@/lib/templates";
import { Ring } from "@/components/ring/Ring";
import { loadRing, themeLinks } from "@/lib/ring-data";

export async function generateMetadata({ params }: { params: Promise<{ ws: string }> }): Promise<Metadata> {
  const ws = await db.workspace.findUnique({ where: { slug: (await params).ws }, select: { name: true } });
  return { title: ws?.name ?? "Workspace" };
}

/** A workspace's home: what it is, its top pages, its people, what just happened. */
export default async function WorkspaceHome({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const [pages, members, activity, journey] = await Promise.all([
    db.page.findMany({
      where: { workspaceId: workspace.id, parentId: null, archivedAt: null, kind: { in: ["PAGE", "DATABASE"] } },
      orderBy: { position: "asc" },
      select: { id: true, title: true, icon: true, kind: true, updatedAt: true },
    }),
    db.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { joinedAt: "asc" },
      select: { user: { select: { name: true } } },
    }),
    db.activity.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { actor: { select: { name: true } }, page: { select: { id: true, title: true, archivedAt: true } } },
    }),
    journeyFor(workspace.id, workspace.slug),
  ]);
  const ring = workspace.kind === "TEAM" ? await loadRing(workspace, viewer.user.id) : [];
  const systems = await db.page.findMany({
    where: { workspaceId: workspace.id, systemKey: { in: ["tasks", "meetings", "goals", "roles", "candidates", "crm"] }, archivedAt: null },
    select: { id: true, systemKey: true },
  });
  const tiles = TEMPLATES.filter((t) => t.kind === "database").map((t) => {
    const found = systems.find((s) => s.systemKey === t.key);
    return { key: t.key, title: t.title, icon: t.icon, blurb: t.blurb, href: found ? pageHref(workspace.slug, found.id) : null };
  });

  return (
    <Screen
      crumbs={[{ label: workspace.name }]}
      actions={
        <>
          {canEdit(role) && (
            <LinkButton href={`/w/${workspace.slug}/templates` as Route} variant="ghost" size="sm">
              <LayoutTemplate className="size-4" /> Templates
            </LinkButton>
          )}
          {canManage(role) && (
            <LinkButton href={`/w/${workspace.slug}/settings` as Route} variant="ghost" size="sm">
              <Settings className="size-4" /> Settings
            </LinkButton>
          )}
        </>
      }
    >
      <div className="mb-10 flex flex-wrap items-start gap-5">
        <WorkspaceMark name={workspace.name} icon={workspace.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-title font-medium">{workspace.name}</h1>
          <p className="mt-2 text-md text-fg-muted">{workspace.oneLiner || "Add a one-liner in settings."}</p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href={`/w/${workspace.slug}/people` as Route} className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-bg-hover">
            <AvatarStack names={members.map((m) => m.user.name)} size="md" />
            <span className="text-sm text-fg-muted">{members.length}</span>
          </Link>
          {canManage(role) && (
            <LinkButton href={`/w/${workspace.slug}/people?invite=1` as Route} size="sm">
              <UserPlus className="size-4" /> Invite
            </LinkButton>
          )}
        </div>
      </div>

      {workspace.kind === "TEAM" && (
        <div className="mb-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <Ring nodes={ring} size={380} themeHref={themeLinks(workspace.slug)} />
          </div>
          <Journey journey={journey} slug={workspace.slug} editable={canEdit(role)} memberCount={members.length} />
        </div>
      )}

      {workspace.kind === "TEAM" && <CompanyTiles workspaceId={workspace.id} slug={workspace.slug} tiles={tiles} editable={canEdit(role)} />}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="mb-3 text-sm text-fg-subtle">Pages</h2>
          {pages.length === 0 ? (
            <p className="text-sm text-fg-subtle">No pages yet. Add one from the sidebar.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pages.map((p) => (
                <Link
                  key={p.id}
                  href={pageHref(workspace.slug, p.id) as Route}
                  className="flex items-center gap-2.5 rounded-lg bg-surface px-3.5 py-3 shadow-card hover:shadow-lift"
                >
                  <PageIcon icon={p.icon} />
                  <span className="min-w-0 flex-1 truncate text-base font-medium">{p.title || "Untitled"}</span>
                  {p.kind === "DATABASE" && <span className="text-xs text-fg-subtle">Database</span>}
                </Link>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-sm text-fg-subtle">Recent activity</h2>
          <ActivityFeed
            workspaceSlug={workspace.slug}
            items={activity.map((a) => ({
              id: a.id,
              kind: a.kind,
              actor: a.actor.name,
              at: a.createdAt.toISOString(),
              page: a.page && !a.page.archivedAt ? { id: a.page.id, title: a.page.title } : null,
              data: (a.data ?? {}) as Record<string, unknown>,
            }))}
          />
        </section>
      </div>
    </Screen>
  );
}
