import type { Metadata } from "next";
import { PageView } from "@/components/page/PageView";
import { db } from "@/lib/db";
import { ancestors, getPageAccess, pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { canManage } from "@/lib/workspace-rules";

export async function generateMetadata({ params }: { params: Promise<{ pageId: string }> }): Promise<Metadata> {
  const p = await db.page.findUnique({ where: { id: (await params).pageId }, select: { title: true } });
  return { title: p?.title || "Untitled" };
}

export default async function PageRoute({ params }: { params: Promise<{ ws: string; pageId: string }> }) {
  const viewer = await requireOnboarded();
  const { ws, pageId } = await params;
  const { page, role, editable } = await getPageAccess(ws, pageId, viewer);
  const [trail, children, members] = await Promise.all([
    ancestors(page.id),
    db.page.findMany({
      where: { parentId: page.id, archivedAt: null, kind: { in: ["PAGE", "DATABASE"] } },
      orderBy: { position: "asc" },
      select: { id: true, title: true, icon: true },
    }),
    db.workspaceMember.findMany({ where: { workspaceId: page.workspaceId }, select: { user: { select: { id: true, name: true } } } }),
  ]);
  const personal = page.workspace.kind === "PERSONAL";

  return (
    <PageView
      page={{
        id: page.id,
        title: page.title,
        icon: page.icon,
        coverUrl: page.coverUrl,
        content: (page.content as unknown[] | null) ?? null,
        fullWidth: page.fullWidth,
        archived: Boolean(page.archivedAt),
        workspaceId: page.workspaceId,
        systemKey: page.systemKey,
      }}
      crumbs={[
        { label: personal ? "Private" : page.workspace.name, href: personal ? undefined : `/w/${ws}` },
        ...trail.map((t) => ({ label: t.title, icon: t.icon, href: pageHref(ws, t.id) })),
        { label: page.title, icon: page.icon },
      ]}
      editable={editable}
      canDeleteForever={canManage(role)}
      childPages={children.map((c) => ({ ...c, href: pageHref(ws, c.id) }))}
      people={members.map((m) => m.user).filter((u) => u.id !== viewer.user.id)}
    />
  );
}
