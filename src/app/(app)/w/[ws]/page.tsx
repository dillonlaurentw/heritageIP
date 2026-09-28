import { Settings, UserPlus } from "lucide-react";
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
import { canManage } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { ActivityFeed } from "./ActivityFeed";

export async function generateMetadata({ params }: { params: Promise<{ ws: string }> }): Promise<Metadata> {
  const ws = await db.workspace.findUnique({ where: { slug: (await params).ws }, select: { name: true } });
  return { title: ws?.name ?? "Workspace" };
}

/** A workspace's home: what it is, its top pages, its people, what just happened. */
export default async function WorkspaceHome({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const [pages, members, activity] = await Promise.all([
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
  ]);

  return (
    <Screen
      crumbs={[{ label: workspace.name }]}
      actions={
        canManage(role) ? (
          <LinkButton href={`/w/${workspace.slug}/settings` as Route} variant="ghost" size="sm">
            <Settings className="size-4" /> Settings
          </LinkButton>
        ) : undefined
      }
    >
      <div className="mb-10 flex items-start gap-4">
        <WorkspaceMark name={workspace.name} icon={workspace.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1>
          <p className="mt-1 text-base text-fg-muted">{workspace.oneLiner || "Add a one-liner in settings."}</p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href={`/w/${workspace.slug}/people` as Route} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-bg-hover">
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

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Pages</h2>
          {pages.length === 0 ? (
            <p className="text-sm text-fg-subtle">No pages yet. Add one from the sidebar.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pages.map((p) => (
                <Link
                  key={p.id}
                  href={pageHref(workspace.slug, p.id) as Route}
                  className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 hover:border-border-strong hover:bg-bg-hover"
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
          <h2 className="mb-3 text-sm font-medium text-fg-muted">Recent activity</h2>
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
