import type { Metadata } from "next";
import type { Route } from "next";
import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/lib/db";
import { pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { canEdit, canManage } from "@/lib/workspace-rules";
import { ensurePersonalWorkspace, getWorkspaceAccess } from "@/lib/workspaces";
import { TrashList } from "./TrashList";

export const metadata: Metadata = { title: "Trash" };

/** Pages moved to the trash, in this workspace and in your private space. */
export default async function TrashPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const personal = await ensurePersonalWorkspace(viewer);
  const rows = await db.page.findMany({
    where: { workspaceId: { in: [workspace.id, personal.id] }, archivedAt: { not: null }, kind: { in: ["PAGE", "DATABASE"] } },
    orderBy: { archivedAt: "desc" },
    select: {
      id: true,
      title: true,
      icon: true,
      archivedAt: true,
      workspaceId: true,
      parent: { select: { archivedAt: true } },
      workspace: { select: { slug: true, kind: true } },
    },
  });
  // Only show the page that was trashed, not everything that went with it.
  const top = rows.filter((r) => !r.parent || r.parent.archivedAt?.getTime() !== r.archivedAt?.getTime());

  return (
    <Screen
      crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` as Route }, { label: "Trash" }]}
      title="Trash"
      description="Restore a page to put it back where it was. Admins can delete pages for good."
      width="narrow"
    >
      {top.length === 0 ? (
        <EmptyState title="Nothing in the trash." />
      ) : (
        <TrashList
          items={top.map((r) => ({
            id: r.id,
            title: r.title,
            icon: r.icon,
            at: r.archivedAt!.toISOString(),
            href: pageHref(r.workspace.slug, r.id),
            where: r.workspace.kind === "PERSONAL" ? "Private" : workspace.name,
            canRestore: r.workspace.kind === "PERSONAL" || canEdit(role),
            canDelete: r.workspace.kind === "PERSONAL" || canManage(role),
          }))}
        />
      )}
    </Screen>
  );
}
