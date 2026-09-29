import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { DatabaseView } from "@/components/database/DatabaseView";
import { LinkButton } from "@/components/ui/Button";
import { RowProperties } from "@/components/database/RowProperties";
import { StepConnections } from "@/components/network/StepConnections";
import { GoalTasks } from "@/components/ops/GoalTasks";
import { MeetingActions } from "@/components/ops/MeetingActions";
import { PageView } from "@/components/page/PageView";
import { loadDatabase } from "@/lib/databases";
import { db } from "@/lib/db";
import { stepSignals } from "@/lib/network";
import { goalTasks, meetingTasks } from "@/lib/ops";
import { ancestors, getPageAccess, pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { canManage } from "@/lib/workspace-rules";

export async function generateMetadata({ params }: { params: Promise<{ pageId: string }> }): Promise<Metadata> {
  const p = await db.page.findUnique({ where: { id: (await params).pageId }, select: { title: true } });
  return { title: p?.title || "Untitled" };
}

/** Any page: a document, a database, or a database row. */
export default async function PageRoute({
  params,
  searchParams,
}: {
  params: Promise<{ ws: string; pageId: string }>;
  searchParams: Promise<{ comment?: string }>;
}) {
  const viewer = await requireOnboarded();
  const { ws, pageId } = await params;
  const { page, role, editable } = await getPageAccess(ws, pageId, viewer);
  const [trail, children, members, openComments] = await Promise.all([
    ancestors(page.id),
    page.kind === "PAGE"
      ? db.page.findMany({
          where: { parentId: page.id, archivedAt: null, kind: { in: ["PAGE", "DATABASE"] } },
          orderBy: { position: "asc" },
          select: { id: true, title: true, icon: true },
        })
      : [],
    db.workspaceMember.findMany({ where: { workspaceId: page.workspaceId }, select: { user: { select: { id: true, name: true } } } }),
    db.comment.count({ where: { pageId: page.id, parentId: null, resolvedAt: null } }),
  ]);
  const personal = page.workspace.kind === "PERSONAL";
  const focusComment = (await searchParams).comment?.slice(0, 64) ?? null;
  const database = page.kind === "DATABASE" ? await loadDatabase(page.id, viewer) : null;
  const parentDb = page.kind === "ROW" && page.parentId ? await loadDatabase(page.parentId, viewer) : null;
  const parentKey = parentDb?.database.systemKey;
  const fromMeeting = parentKey === "meetings" ? await meetingTasks(page.workspaceId, ws, page.id) : null;
  const forGoal = parentKey === "goals" ? await goalTasks(page.workspaceId, ws, page.id) : null;
  const forStep = parentKey === "gamePlan" ? await stepSignals(page.id, viewer.user.id) : null;
  const postedRole = parentKey === "roles" && (page.props as Record<string, unknown> | null)?.posted === true;
  const tasksDb = forGoal
    ? await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: page.workspaceId, systemKey: "tasks" } }, select: { id: true } })
    : null;

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
      comments={personal || page.kind === "DATABASE" ? undefined : { me: viewer.user.id, canManage: canManage(role), open: openComments, focus: focusComment }}
      live={page.kind === "DATABASE" || page.archivedAt ? undefined : { id: viewer.user.id, name: viewer.user.name }}
      childPages={children.map((c) => ({ ...c, href: pageHref(ws, c.id) }))}
      people={members.map((m) => m.user).filter((u) => u.id !== viewer.user.id)}
      topActions={
        editable && page.systemKey === "thesis" ? (
          <>
            <LinkButton href={`/w/${ws}/thesis` as Route} variant="ghost" size="sm">
              <Sparkles className="size-3.5" /> Sharpen with SELF
            </LinkButton>
            <LinkButton href={`/w/${ws}/plan` as Route} size="sm">
              Plan with SELF
            </LinkButton>
          </>
        ) : editable && page.systemKey === "gamePlan" ? (
          <LinkButton href={`/w/${ws}/plan` as Route} variant="ghost" size="sm">
            <Sparkles className="size-3.5" /> Plan with SELF
          </LinkButton>
        ) : undefined
      }
      titlePlaceholder={page.kind === "DATABASE" ? "Untitled database" : "Untitled"}
      hideEditor={page.kind === "DATABASE"}
      hideChildren={page.kind !== "PAGE"}
      wide={page.kind === "DATABASE"}
      aboveEditor={
        database ? (
          <div className="mt-2">
            {database.database.description && <p className="mb-4 max-w-2xl text-base text-fg-muted">{database.database.description}</p>}
            <DatabaseView initial={database} />
          </div>
        ) : parentDb ? (
          <>
            <RowProperties initial={parentDb} rowId={page.id} />
            {forGoal && <GoalTasks tasks={forGoal} tasksHref={tasksDb ? pageHref(ws, tasksDb.id) : null} />}
            {forStep && <StepConnections items={forStep} />}
            {postedRole && (
              <p className="mb-4 text-sm text-fg-muted">
                Posted to the Network.{" "}
                <Link href={`/network/roles/${page.id}` as Route} className="text-fg underline underline-offset-2">
                  See the public role
                </Link>
              </p>
            )}
          </>
        ) : undefined
      }
      belowEditor={fromMeeting ? <MeetingActions meetingId={page.id} tasks={fromMeeting} editable={editable} /> : undefined}
    />
  );
}
