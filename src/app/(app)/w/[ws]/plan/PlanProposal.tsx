"use client";

import { Check } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptPlan, proposePlan } from "@/app/actions/thesis";
import { AgentStatus, type AgentState } from "@/components/agents/AgentStatus";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { NEED_TAGS, NEEDS, type Need } from "@/lib/needs";
import { STAGES } from "@/lib/system-dbs";

type Step = { stage: "VALIDATE" | "SETUP" | "BUILD" | "LAUNCH"; title: string; detail: string; needs: Need[]; keep: boolean };

/** Agents propose, builders dispose: pick, tweak, then add to the Game plan. */
export function PlanProposal({ workspaceId, live, editable, planHref }: { workspaceId: string; live: boolean; editable: boolean; planHref: string | null }) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [state, setState] = useState<AgentState>("idle");
  const [demo, setDemo] = useState(!live);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const generate = () => {
    setState("thinking");
    setError(null);
    start(async () => {
      const res = await proposePlan(workspaceId);
      if (!res.ok) {
        setState("error");
        setError(res.message);
        return;
      }
      setDemo(res.demo);
      setSteps(res.output.steps.map((s) => ({ ...s, needs: s.needs as Need[], keep: true })));
      setState("done");
    });
  };

  const update = (i: number, patch: Partial<Step>) => setSteps((xs) => xs!.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const kept = steps?.filter((s) => s.keep) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl bg-surface shadow-card p-4">
        <AgentStatus name="Game-plan agent" state={state} demo={demo} />
        {planHref && (
          <p className="mt-3 text-sm text-fg-muted">
            You already have a{" "}
            <Link href={planHref as Route} className="text-fg underline underline-offset-2">
              game plan
            </Link>
            . A new plan replaces the steps SELF added before that aren&apos;t done. Finished steps and steps you wrote yourself stay.
          </p>
        )}
      </div>

      {!steps && editable && (
        <div>
          <Button variant="primary" size="md" onClick={generate} disabled={busy}>
            {state === "thinking" ? "Thinking…" : planHref ? "Propose a new plan" : "Propose a game plan"}
          </Button>
        </div>
      )}

      {steps &&
        STAGES.map((stage) => {
          const inStage = steps.map((s, i) => ({ s, i })).filter(({ s }) => s.stage === stage.id);
          if (inStage.length === 0) return null;
          return (
            <section key={stage.id}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-fg-muted">
                <Tag color={stage.color}>{stage.name}</Tag>
              </h2>
              <ul className="flex flex-col divide-y divide-border rounded-xl bg-surface shadow-card">
                {inStage.map(({ s, i }) => (
                  <li key={i} className={cn("flex gap-3 px-4 py-3", !s.keep && "opacity-50")}>
                    <button
                      type="button"
                      aria-label={s.keep ? "Leave this step out" : "Keep this step"}
                      onClick={() => update(i, { keep: !s.keep })}
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        s.keep ? "border-primary bg-primary text-primary-fg" : "border-border-strong",
                      )}
                    >
                      {s.keep && <Check className="size-3" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <input
                        value={s.title}
                        onChange={(e) => update(i, { title: e.target.value })}
                        className="w-full bg-transparent text-base font-medium outline-none"
                        aria-label="Step"
                      />
                      <p className="mt-0.5 text-sm text-fg-muted">{s.detail}</p>
                      {s.keep && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {s.needs.map((n) => (
                            <Tag key={n} color={NEEDS[n].color} onRemove={() => update(i, { needs: s.needs.filter((x) => x !== n) })}>
                              {NEEDS[n].label}
                            </Tag>
                          ))}
                          {s.needs.length < NEED_TAGS.length && (
                            <select
                              aria-label="Add a need"
                              value=""
                              onChange={(e) => e.target.value && update(i, { needs: [...s.needs, e.target.value as Need] })}
                              className="h-5 cursor-pointer appearance-none rounded-sm bg-transparent px-1 text-xs text-fg-subtle hover:bg-bg-hover hover:text-fg-muted"
                            >
                              <option value="">+ Need</option>
                              {NEED_TAGS.filter((n) => !s.needs.includes(n)).map((n) => (
                                <option key={n} value={n}>
                                  {NEEDS[n].label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {steps && editable && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-border bg-bg py-4">
          <Button
            variant="primary"
            size="md"
            disabled={busy || kept.length === 0}
            onClick={() =>
              start(async () => {
                const res = await acceptPlan(
                  workspaceId,
                  kept.map((s) => ({ stage: s.stage, title: s.title, detail: s.detail, needs: s.needs })),
                );
                if (!res.ok) setError(res.message);
                else router.push(res.href as Route);
              })
            }
          >
            Add {kept.length} {kept.length === 1 ? "step" : "steps"} to the game plan
          </Button>
          <Button size="md" onClick={generate} disabled={busy}>
            Try again
          </Button>
          <Button variant="ghost" size="md" onClick={() => setSteps(null)} disabled={busy}>
            Discard
          </Button>
        </div>
      )}
    </div>
  );
}
