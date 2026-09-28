import { Plus } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Screen } from "@/components/shell/Screen";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageIcon, WorkspaceMark } from "@/components/ui/PageIcon";
import { db } from "@/lib/db";
import { pageHref, searchPages } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/workspace-rules";
import { listWorkspaces } from "@/lib/workspaces";
import { AcceptInviteButton } from "./AcceptInviteButton";

export const metadata: Metadata = { title: "Home" };

const greeting = () => {
  const h = new Date().getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default async function HomePage() {
  const viewer = await requireOnboarded();
  const [workspaces, recent, invites] = await Promise.all([
    listWorkspaces(viewer.user.id),
    searchPages(viewer, ""),
    db.invite.findMany({
      where: { email: viewer.user.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { workspace: { select: { name: true, icon: true } }, invitedBy: { select: { name: true } } },
    }),
  ]);
  const first = viewer.user.name.split(" ")[0];

  return (
    <Screen crumbs={[{ label: "Home" }]} title={`${greeting()}, ${first}`} description="Your workspaces and what you touched last.">
      {invites.length > 0 && (
        <section className="mb-10 flex flex-col gap-2">
          {invites.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-accent bg-accent-soft px-4 py-3">
              <WorkspaceMark name={i.workspace.name} icon={i.workspace.icon} size="md" />
              <p className="min-w-0 flex-1 text-base">
                <span className="font-medium">{i.invitedBy.name}</span> invited you to{" "}
                <span className="font-medium">{i.workspace.name}</span> as {ROLE_LABEL[i.role].toLowerCase()}.
              </p>
              <AcceptInviteButton token={i.token} />
            </div>
          ))}
        </section>
      )}

      <section className="mb-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg-muted">Workspaces</h2>
          <LinkButton href="/new" variant="ghost" size="xs">
            <Plus className="size-3.5" /> New workspace
          </LinkButton>
        </div>
        {workspaces.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border">
            <EmptyState
              title="What are you building?"
              hint="A workspace holds one company or idea: its pages, plan and people."
              action={
                <LinkButton href="/new" variant="primary" size="md">
                  <Plus className="size-4" /> Start a workspace
                </LinkButton>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((w) => (
              <Link
                key={w.id}
                href={`/w/${w.slug}` as Route}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:border-border-strong hover:bg-bg-hover"
              >
                <div className="flex items-center gap-2.5">
                  <WorkspaceMark name={w.name} icon={w.icon} size="md" />
                  <span className="truncate text-base font-semibold">{w.name}</span>
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-fg-muted">{w.oneLiner || "No one-liner yet."}</p>
                <p className="text-xs text-fg-subtle">
                  {ROLE_LABEL[w.role]} · {w.memberCount} {w.memberCount === 1 ? "person" : "people"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-fg-muted">Recently edited</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-fg-subtle">Pages you edit show up here.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {recent.map((p) => (
              <li key={p.id}>
                <Link href={pageHref(p.workspace.slug, p.id) as Route} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover">
                  <PageIcon icon={p.icon} />
                  <span className="min-w-0 flex-1 truncate text-base">{p.title || "Untitled"}</span>
                  <span className="truncate text-xs text-fg-subtle">{p.workspace.kind === "PERSONAL" ? "Private" : p.workspace.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}
