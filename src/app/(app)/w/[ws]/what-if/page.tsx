import type { Metadata, Route } from "next";
import Link from "next/link";
import { Ring } from "@/components/ring/Ring";
import { Topbar } from "@/components/shell/Topbar";
import { AgentMark } from "@/components/ui/AgentMark";
import { Card, Eyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { pageHref } from "@/lib/pages";
import { THEME_COPY } from "@/lib/ring";
import { loadRing } from "@/lib/ring-data";
import { requireOnboarded } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { canEdit } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { listWhatIfs, planStepsFor } from "@/lib/what-if";
import { whatIfIdeas } from "@/lib/what-if-rules";
import { AskWhatIf, PickChanges } from "./WhatIfClient";

export const metadata: Metadata = { title: "What if" };

/** Business what-ifs: something that might happen, checked against the plan. A check, not a forecast. */
export default async function WhatIfPage({ params, searchParams }: { params: Promise<{ ws: string }>; searchParams: Promise<{ check?: string }> }) {
  const viewer = await requireOnboarded();
  const [{ ws }, sp] = await Promise.all([params, searchParams]);
  const { workspace, role } = await getWorkspaceAccess(ws, viewer);
  const [checks, steps, ring] = await Promise.all([listWhatIfs(workspace.id), planStepsFor(workspace.id), loadRing(workspace, viewer.user.id)]);
  const check = checks.find((c) => c.id === sp.check) ?? checks[0] ?? null;
  const editable = canEdit(role);
  const base = `/w/${workspace.slug}`;

  return (
    <>
      <Topbar crumbs={[{ label: workspace.name, href: base as Route }, { label: "What if" }]} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pt-4 pb-24 md:px-12">
        <div className="flex flex-col gap-3">
          <span className="text-sm text-fg-subtle">What if…</span>
          {editable ? (
            <AskWhatIf workspaceId={workspace.id} slug={workspace.slug} ideas={whatIfIdeas(steps)} />
          ) : (
            <p className="text-sm text-fg-muted">Members can check what-ifs against the plan.</p>
          )}
        </div>

        {!check ? (
          <Card lift className="flex flex-col gap-3 p-10">
            <h1 className="text-2xl font-medium">See what breaks before it happens</h1>
            <p className="max-w-xl text-md text-fg-muted">
              Describe something that might happen: a supplier slips, a grant is late, someone goes part-time. SELF checks it against your
              plan and suggests changes. Nothing changes until you add it.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_22rem]">
            <main className="flex min-w-0 flex-col gap-5">
              <Card className="flex items-center gap-4 px-6 py-5">
                <AgentMark mark="Pl" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <h1 className="text-2xl font-medium tracking-tight">{check.scenario}</h1>
                  <span className="text-sm text-fg-subtle">
                    Checked by {check.by.split(" ")[0]} · {formatDate(check.at)}
                    {check.demo && " · demo agent"}
                  </span>
                </span>
              </Card>
              <p className="text-md leading-relaxed text-fg-muted">{check.summary}</p>
              <Card className="flex flex-col px-6 py-5">
                <span className="pb-3 text-base font-medium">What would slip</span>
                {check.slips.length === 0 ? (
                  <p className="text-sm text-fg-muted">Nothing in the plan depends on this directly.</p>
                ) : (
                  check.slips.map((s) => (
                    <Link
                      key={s.stepId}
                      href={pageHref(workspace.slug, s.stepId) as Route}
                      className="grid grid-cols-1 gap-1 border-t border-border py-3 hover:bg-bg-hover sm:grid-cols-[1fr_auto] sm:gap-6"
                    >
                      <span className="text-base">{s.title}</span>
                      <span className="text-sm text-accent-text sm:text-right">{s.effect}</span>
                    </Link>
                  ))
                )}
                <div className="flex flex-col gap-1 border-t border-border pt-4">
                  <span className="text-sm text-fg-subtle">Money</span>
                  <p className="text-base leading-relaxed">{check.money}</p>
                </div>
              </Card>
            </main>

            <aside className="flex flex-col gap-5 lg:sticky lg:top-20">
              <Card className="flex flex-col items-center gap-4 p-5">
                <Ring nodes={ring} size={200} labels={false} highlight={check.themes.map((t) => t.theme)} />
                <div className="flex w-full flex-col gap-2">
                  {check.themes.map((t) => (
                    <p key={t.theme} className="text-sm leading-relaxed">
                      <span className="font-medium">{THEME_COPY[t.theme].label}:</span> <span className="text-fg-muted">{t.note}</span>
                    </p>
                  ))}
                </div>
              </Card>
              {check.changes.length > 0 && (
                <PickChanges workspaceId={workspace.id} checkId={check.id} changes={check.changes.map((c) => ({ title: c.title, detail: c.detail }))} applied={check.applied} editable={editable} />
              )}
              <p className="text-center text-xs text-fg-subtle">Nothing changes until you add it. A check, not a forecast.</p>
            </aside>
          </div>
        )}

        {checks.length > 1 && (
          <div className="flex flex-col gap-2">
            <Eyebrow>Earlier checks</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {checks.map((c) => (
                <Link
                  key={c.id}
                  href={`${base}/what-if?check=${c.id}` as Route}
                  className={cn("rounded-full px-3.5 py-1.5 text-sm", c.id === check?.id ? "bg-surface font-medium shadow-card" : "text-fg-muted shadow-[inset_0_0_0_1px_var(--border-strong)] hover:text-fg")}
                >
                  {c.scenario.length > 60 ? `${c.scenario.slice(0, 58)}…` : c.scenario}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
