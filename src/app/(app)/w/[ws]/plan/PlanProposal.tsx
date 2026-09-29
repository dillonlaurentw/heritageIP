"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { acceptPlan, proposePlan } from "@/app/actions/thesis";
import { FlowSteps } from "@/components/flow/FlowSteps";
import { Ring } from "@/components/ring/Ring";
import { AgentMark } from "@/components/ui/AgentMark";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { NEED_TAGS, NEED_THEME, needChip, NEEDS, type Need } from "@/lib/needs";
import { THEME_COPY, THEMES, type RingNode } from "@/lib/ring";
import { buildRing } from "@/lib/ring-build";

type Stage = "VALIDATE" | "SETUP" | "BUILD" | "LAUNCH";
type Step = { stage: Stage; title: string; detail: string; needs: Need[]; keep: boolean };

const STAGE_NAME: Record<Stage, string> = { VALIDATE: "Validate", SETUP: "Set up", BUILD: "Build", LAUNCH: "Launch" };
const STAGE_ORDER: Stage[] = ["VALIDATE", "SETUP", "BUILD", "LAUNCH"];

/** Agents propose, builders dispose: steps arrive by stage, each saying who it needs; the ring shows the gaps. */
export function PlanProposal({
  workspace,
  live,
  editable,
  planHref,
  baseRing,
}: {
  workspace: { id: string; slug: string };
  live: boolean;
  editable: boolean;
  planHref: string | null;
  baseRing: RingNode[];
}) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [demo, setDemo] = useState(!live);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const generate = () => {
    setError(null);
    start(async () => {
      const res = await proposePlan(workspace.id);
      if (!res.ok) return setError(res.message);
      setDemo(res.demo);
      setSteps(res.output.steps.map((s) => ({ ...s, needs: s.needs as Need[], keep: true })));
    });
  };

  const update = (i: number, patch: Partial<Step>) => setSteps((xs) => xs!.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const kept = useMemo(() => steps?.filter((s) => s.keep) ?? [], [steps]);

  // The ring as it would look with this plan: today's people, plus an open chair per need.
  const ring = useMemo(() => {
    const chairs = buildRing({
      viewerId: "",
      slug: workspace.slug,
      members: [],
      roles: [],
      signals: [],
      openSteps: kept.map((s, i) => ({ id: `draft-${i}`, title: s.title, needs: s.needs })),
    }).map((n) => ({ ...n, href: undefined }));
    return [...baseRing, ...chairs];
  }, [kept, baseRing, workspace.slug]);

  const needsByTheme = THEMES.map((t) => ({
    theme: t,
    needs: [...new Set(kept.flatMap((s) => s.needs).filter((n) => NEED_THEME[n] === t))],
  }));

  const accept = () =>
    start(async () => {
      const res = await acceptPlan(
        workspace.id,
        kept.map((s) => ({ stage: s.stage, title: s.title, detail: s.detail, needs: s.needs })),
      );
      if (!res.ok) return setError(res.message);
      router.push(`/w/${workspace.slug}` as Route);
    });

  if (!steps) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
        <FlowSteps current="Plan" className="mb-2" />
        <div className="flex items-start gap-3.5">
          <AgentMark mark="Pl" size="lg" label="Planner agent" />
          <div className="flex flex-col gap-2 pt-1">
            <h1 className="text-3xl font-medium tracking-tight">From your thesis to a first sale</h1>
            <p className="text-lg leading-relaxed text-fg-muted">
              The Planner turns your thesis into steps in four stages. It starts with what&apos;s still unproven, and every step says
              who it needs, so the ring knows where to look.
              {demo && <span className="ml-2 text-xs text-fg-subtle">demo agent</span>}
            </p>
          </div>
        </div>
        {planHref && (
          <p className="text-sm text-fg-muted">
            You already have a{" "}
            <Link href={planHref as Route} className="text-fg underline underline-offset-2">
              game plan
            </Link>
            . A new one replaces the steps SELF added that aren&apos;t done; finished steps and ones you wrote stay.
          </p>
        )}
        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        {editable && (
          <div>
            <Button variant="primary" size="lg" onClick={generate} disabled={busy}>
              {busy ? "Thinking…" : planHref ? "Propose a new plan" : "Build my plan"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <FlowSteps current="Plan" className="mb-8" />
      <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[1fr_19rem]">
        <main className="flex min-w-0 flex-col gap-6">
          <div className="flex items-start gap-3.5">
            <AgentMark mark="Pl" size="lg" label="Planner agent" />
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-medium tracking-tight">
                {kept.length} {kept.length === 1 ? "step" : "steps"} from your thesis to a first sale
              </h1>
              <p className="text-md text-fg-muted">
                Keep what fits, drop what doesn&apos;t, change anything. Nothing is saved until you use it.
                {demo && <span className="ml-2 text-xs text-fg-subtle">demo agent</span>}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {STAGE_ORDER.map((stage) => {
              const inStage = steps.map((s, i) => ({ s, i })).filter(({ s }) => s.stage === stage);
              if (inStage.length === 0) return null;
              return (
                <section key={stage} className="flex flex-col gap-2.5">
                  <h2 className="px-1 text-base font-medium">{STAGE_NAME[stage]}</h2>
                  {inStage.map(({ s, i }) => (
                    <StepCard key={i} step={s} editable={editable} onChange={(patch) => update(i, patch)} />
                  ))}
                </section>
              );
            })}
          </div>
          {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        </main>

        <aside aria-label="What this plan needs" className="flex flex-col gap-5 xl:sticky xl:top-20">
          <div className="flex justify-center">
            <Ring nodes={ring} size={220} labels={false} />
          </div>
          <div className="flex flex-col">
            <Eyebrow className="pb-2">What this plan needs</Eyebrow>
            {needsByTheme.map(({ theme, needs }) => (
              <div key={theme} className="flex justify-between gap-4 border-t border-border py-2.5 text-sm last:border-b">
                <span className="font-medium">{THEME_COPY[theme].label}</span>
                <span className="text-right text-fg-muted">{needs.length ? needs.map((n) => NEEDS[n].label.toLowerCase()).join(", ") : "not yet"}</span>
              </div>
            ))}
          </div>
          {editable && (
            <div className="flex flex-col gap-2.5">
              <Button variant="primary" size="lg" onClick={accept} disabled={busy || kept.length === 0}>
                {busy ? "Saving…" : "Use this plan"}
              </Button>
              <Button size="lg" onClick={generate} disabled={busy}>
                Try again
              </Button>
              <button type="button" onClick={() => setSteps(null)} disabled={busy} className="text-sm text-fg-subtle hover:text-fg">
                Discard
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function StepCard({ step, editable, onChange }: { step: Step; editable: boolean; onChange: (p: Partial<Step>) => void }) {
  if (!step.keep) {
    return (
      <Card className="flex flex-col gap-1.5 px-4 py-3.5 opacity-60">
        <span className="flex items-start justify-between gap-3">
          <span className="text-base font-medium line-through">{step.title}</span>
          {editable && (
            <button type="button" onClick={() => onChange({ keep: true })} className="text-sm text-fg-muted hover:text-fg">
              Undo
            </button>
          )}
        </span>
        <span className="text-xs text-fg-subtle">You dropped this.</span>
      </Card>
    );
  }
  const open = step.needs.some((n) => n === "COFOUNDER");
  return (
    <Card className={cn("flex flex-col gap-2.5 px-4 py-3.5", open && "shadow-[0_0_0_1.5px_var(--accent)]")}>
      <span className="flex items-start justify-between gap-2">
        <input
          value={step.title}
          readOnly={!editable}
          onChange={(e) => onChange({ title: e.target.value })}
          aria-label="Step"
          className="min-w-0 flex-1 bg-transparent text-base leading-snug font-medium outline-none"
        />
        {editable && (
          <button type="button" aria-label="Drop this step" onClick={() => onChange({ keep: false })} className="text-base leading-none text-fg-subtle hover:text-fg">
            ×
          </button>
        )}
      </span>
      {step.detail && <span className="line-clamp-2 text-sm text-fg-muted">{step.detail}</span>}
      <span className="flex flex-wrap items-center gap-1.5">
        {step.needs.length === 0 && <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-fg-muted">You</span>}
        {step.needs.map((n) => (
          <span
            key={n}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs whitespace-nowrap",
              n === "COFOUNDER" ? "bg-surface text-accent-text shadow-[inset_0_0_0_1px_var(--accent)]" : "bg-bg text-fg-muted",
            )}
          >
            {needChip(n)}
            {editable && (
              <button type="button" aria-label={`Remove ${needChip(n)}`} onClick={() => onChange({ needs: step.needs.filter((x) => x !== n) })} className="opacity-50 hover:opacity-100">
                ×
              </button>
            )}
          </span>
        ))}
        {editable && step.needs.length < NEED_TAGS.length && (
          <select
            aria-label="Who else this step needs"
            value=""
            onChange={(e) => e.target.value && onChange({ needs: [...step.needs, e.target.value as Need] })}
            className="h-6 cursor-pointer appearance-none rounded-full bg-transparent px-2 text-xs text-fg-subtle hover:bg-bg-hover hover:text-fg-muted"
          >
            <option value="">+ Who</option>
            {NEED_TAGS.filter((n) => !step.needs.includes(n)).map((n) => (
              <option key={n} value={n}>
                {needChip(n)}
              </option>
            ))}
          </select>
        )}
      </span>
    </Card>
  );
}
