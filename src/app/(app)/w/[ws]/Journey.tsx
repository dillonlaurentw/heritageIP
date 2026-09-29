import { ArrowRight, Check } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { NEEDS, type Need } from "@/lib/needs";
import { pageHref } from "@/lib/pages";

type Step = { label: string; done: boolean; detail: string; href: string; cta?: string };

/** Where a company is on the path from idea to launch, and what it needs next. */
export async function journeyFor(workspaceId: string, slug: string) {
  const [thesis, plan] = await Promise.all([
    db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId, systemKey: "thesis" } }, select: { id: true, archivedAt: true } }),
    db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId, systemKey: "gamePlan" } }, select: { id: true, archivedAt: true } }),
  ]);
  const rows = plan && !plan.archivedAt
    ? await db.page.findMany({ where: { parentId: plan.id, kind: "ROW", archivedAt: null }, select: { id: true, title: true, props: true } })
    : [];
  const steps = rows.map((r) => ({ id: r.id, title: r.title, props: (r.props ?? {}) as { status?: string; needs?: string[] } }));
  const done = steps.filter((s) => s.props.status === "done").length;
  // Open needs: each need tag on an unfinished step, first step per need.
  const needs = new Map<Need, { stepId: string; step: string; count: number }>();
  for (const s of steps) {
    if (s.props.status === "done") continue;
    for (const n of s.props.needs ?? []) {
      if (!(n in NEEDS)) continue;
      const cur = needs.get(n as Need);
      if (cur) cur.count += 1;
      else needs.set(n as Need, { stepId: s.id, step: s.title, count: 1 });
    }
  }
  return {
    thesisHref: thesis && !thesis.archivedAt ? pageHref(slug, thesis.id) : null,
    planHref: plan && !plan.archivedAt ? pageHref(slug, plan.id) : null,
    total: steps.length,
    done,
    needs: [...needs.entries()].map(([need, v]) => ({ need, ...v })),
  };
}

export function Journey({
  journey,
  slug,
  editable,
  memberCount,
}: {
  journey: Awaited<ReturnType<typeof journeyFor>>;
  slug: string;
  editable: boolean;
  memberCount: number;
}) {
  const steps: Step[] = [
    { label: "Idea", done: true, detail: "Written down", href: `/w/${slug}` },
    journey.thesisHref
      ? { label: "Thesis", done: true, detail: "Problem, who, why now, why you", href: journey.thesisHref }
      : { label: "Thesis", done: false, detail: "Turn the idea into a thesis", href: `/w/${slug}/thesis`, cta: "Write the thesis" },
    journey.planHref && journey.total > 0
      ? { label: "Game plan", done: journey.done === journey.total, detail: `${journey.done} of ${journey.total} steps done`, href: journey.planHref }
      : { label: "Game plan", done: false, detail: "Steps from idea to launch", href: `/w/${slug}/plan`, cta: "Plan with SELF" },
    memberCount > 1
      ? { label: "Team", done: true, detail: `${memberCount} people`, href: `/w/${slug}/people` }
      : { label: "Team", done: false, detail: "Invite a co-founder", href: `/w/${slug}/people?invite=1`, cta: "Invite" },
  ];
  const next = steps.find((s) => !s.done && s.cta);

  return (
    <section aria-label="From idea to launch" className="rounded-xl bg-surface shadow-card">
      <ol className="flex flex-col">
        {steps.map((s, i) => (
          <li key={s.label} className="border-b border-border last:border-b-0">
            <Link href={s.href as Route} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-bg-hover">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                  s.done ? "bg-primary text-primary-fg" : "border border-border-strong text-fg-subtle",
                )}
              >
                {s.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-medium">{s.label}</span>
                <span className="text-sm text-fg-muted">{s.detail}</span>
              </span>
              {journey.planHref && s.label === "Game plan" && journey.total > 0 && (
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-inset">
                  <span className="block h-full bg-primary" style={{ width: `${(journey.done / journey.total) * 100}%` }} />
                </span>
              )}
              {editable && next === s && <span className="text-sm font-medium whitespace-nowrap">{s.cta}</span>}
              <ArrowRight className="size-4 shrink-0 text-fg-subtle" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
