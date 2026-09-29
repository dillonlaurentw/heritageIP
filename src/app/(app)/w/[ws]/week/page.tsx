import type { Metadata, Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Screen } from "@/components/shell/Screen";
import { Progress } from "@/components/ui/Progress";
import { Tag } from "@/components/ui/Tag";
import { weekData } from "@/lib/ops";
import { pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { canEdit } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { SaveWeek } from "./SaveWeek";

export const metadata: Metadata = { title: "This week" };

const HEALTH: Record<string, { name: string; color: "green" | "yellow" | "red" | "blue" }> = {
  on: { name: "On track", color: "green" },
  risk: { name: "At risk", color: "yellow" },
  off: { name: "Off track", color: "red" },
  done: { name: "Achieved", color: "blue" },
};

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h2 className="mb-2 flex items-baseline gap-2 text-sm font-medium">
        {title}
        {count !== undefined && <span className="text-xs font-normal text-fg-subtle">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-fg-subtle">{children}</p>;

/** What changed this week: done, new, goals, what's coming. Saved as a page on request. */
export default async function WeekPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const w = await weekData(workspace.id, workspace.slug);
  const item = (a: { title: string; pageId?: string | null }, i: number, extra?: ReactNode) => (
    <li key={i} className="flex items-baseline gap-2 py-0.5 text-base">
      <span className="text-fg-subtle">·</span>
      {a.pageId ? (
        <Link href={pageHref(workspace.slug, a.pageId) as Route} className="hover:underline">
          {a.title || "Untitled"}
        </Link>
      ) : (
        <span>{a.title || "Untitled"}</span>
      )}
      {extra}
    </li>
  );

  return (
    <Screen
      crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` }, { label: "This week" }]}
      title="This week"
      description={`What changed in ${workspace.name} since ${formatDate(w.since)}. Save it as a page to share or add notes.`}
      headerActions={canEdit(role) ? <SaveWeek workspaceId={workspace.id} /> : undefined}
      width="narrow"
    >
      <div className="flex flex-col gap-6">
        <Section title="Done" count={w.summary.finished.length}>
          {w.summary.finished.length ? <ul>{w.summary.finished.map((a, i) => item(a, i, <span className="text-xs text-fg-subtle">{a.actor.split(" ")[0]}</span>))}</ul> : <Empty>Nothing marked done yet this week.</Empty>}
        </Section>

        <Section title="New" count={w.summary.created.length}>
          {w.summary.created.length ? <ul>{w.summary.created.map((a, i) => item(a, i))}</ul> : <Empty>No new pages or plans.</Empty>}
        </Section>

        {(w.plan || w.goals.length > 0) && (
          <Section title="Progress">
            <ul className="flex flex-col gap-1.5">
              {w.plan && (
                <li className="flex items-center gap-3 text-base">
                  <Link href={w.plan.href as Route} className="min-w-0 flex-1 truncate hover:underline">
                    Game plan
                  </Link>
                  <Progress done={w.plan.done} total={w.plan.total} />
                </li>
              )}
              {w.goals.map((g) => (
                <li key={g.id} className="flex items-center gap-3 text-base">
                  <Link href={g.href as Route} className="min-w-0 flex-1 truncate hover:underline">
                    {g.title}
                  </Link>
                  {g.health && HEALTH[g.health] && <Tag color={HEALTH[g.health].color}>{HEALTH[g.health].name}</Tag>}
                  {g.progress ? <Progress {...g.progress} /> : <span className="text-xs text-fg-subtle">No linked tasks</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Coming up" count={w.upcoming.length}>
          {w.upcoming.length ? (
            <ul>
              {w.upcoming.map((t, i) => item({ title: t.title, pageId: t.id }, i, <span className="text-xs text-fg-subtle">{formatDate(t.due)}</span>))}
            </ul>
          ) : (
            <Empty>Nothing due in the next seven days.</Empty>
          )}
        </Section>

        {w.overdue.length > 0 && (
          <Section title="Overdue" count={w.overdue.length}>
            <ul>{w.overdue.map((t, i) => item({ title: t.title, pageId: t.id }, i, <span className="text-xs text-danger">{formatDate(t.due)}</span>))}</ul>
          </Section>
        )}

        {w.meetings.length > 0 && (
          <Section title="Meetings" count={w.meetings.length}>
            <ul>{w.meetings.map((m, i) => item({ title: m.title, pageId: m.id }, i, <span className="text-xs text-fg-subtle">{formatDate(m.date)}</span>))}</ul>
          </Section>
        )}

        {w.summary.joined.length > 0 && (
          <Section title="Joined">
            <p className="text-base">{w.summary.joined.map((a) => a.actor).join(", ")}</p>
          </Section>
        )}
      </div>
    </Screen>
  );
}
