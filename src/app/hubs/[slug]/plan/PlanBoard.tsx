"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { Route } from "next";
import { useState, useTransition } from "react";
import { addStep, deleteStep, generatePlan, moveStep, toggleDone, updateStep, type StepInput } from "./actions";
import { AgentStrip, type AgentState } from "@/components/agents/AgentStrip";
import { NeedTag } from "@/components/plan/NeedTag";
import { Button } from "@/components/ui/ArrowLink";
import { Chips } from "@/components/ui/Chips";
import { TextArea, TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { duration, ease } from "@/design/motion";
import { NEED_TAGS, NEEDS } from "@/lib/needs";
import { STAGE_COPY, STAGES, type Stage } from "@/lib/plan-order";
import type { StepView } from "@/lib/plan";

type Props = {
  hub: { id: string; slug: string; name: string; hasThesis: boolean };
  initial: StepView[];
  live: boolean;
  /** Team members see the plan but can't change it. */
  readOnly?: boolean;
};

type Result = { ok: true; steps: StepView[]; demo?: boolean } | { ok: false; message: string };

const pad = (n: number) => String(n).padStart(2, "0");

export function PlanBoard({ hub, initial, live, readOnly = false }: Props) {
  const [steps, setSteps] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null); // step id, or "new:STAGE"
  const [state, setState] = useState<AgentState>("idle");
  const [demo, setDemo] = useState(!live);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const reduce = useReducedMotion();

  const doneCount = steps.filter((s) => s.done).length;

  function run(action: () => Promise<Result>, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await action();
      if (res.ok) {
        setSteps(res.steps);
        after?.();
      } else setError(res.message);
    });
  }

  function generate() {
    if (steps.some((s) => !s.done) && !confirm("Replace every step that isn't done yet? Done steps stay.")) return;
    setState("thinking");
    setError(null);
    start(async () => {
      const res = await generatePlan(hub.id);
      if (res.ok) {
        setSteps(res.steps);
        setDemo(Boolean(res.demo));
        setState("done");
      } else {
        setError(res.message);
        setState("error");
      }
    });
  }

  if (!hub.hasThesis && steps.length === 0) {
    return (
      <div className="border-y border-line py-[14vh]">
        <Link href={`/hubs/${hub.slug}/thesis` as Route} className="group type-display text-headline">
          Write the thesis first. The plan is built from it. <span className="inline-block transition-transform group-hover:translate-x-2">→</span>
        </Link>
      </div>
    );
  }

  // Step numbers run across stages; steps arrive sorted by stage then position.
  const numberOf = new Map(steps.map((s, i) => [s.id, i + 1]));

  if (readOnly) {
    return (
      <div className="flex flex-col gap-10">
        <Label>
          Read only · Step {pad(doneCount)}/{pad(steps.length)} done
        </Label>
        {steps.length === 0 && <p className="text-lead text-smoke">No plan yet.</p>}
        {STAGES.map((stage, si) => {
          const inStage = steps.filter((s) => s.stage === stage);
          if (!inStage.length) return null;
          return (
            <section key={stage} className="grid grid-cols-1 gap-6 border-t border-line pt-8 md:grid-cols-[16rem_1fr]">
              <div>
                <Label>Stage {pad(si + 1)}</Label>
                <h2 className="type-display mt-2 text-title">{STAGE_COPY[stage].label}</h2>
              </div>
              <div className="flex flex-col">
                {inStage.map((step) => {
                  return (
                    <div key={step.id} className="border-b border-line py-5 last:border-b-0">
                      <Label tone={step.done ? "signal" : "bone"}>
                        Step {pad(numberOf.get(step.id)!)}
                        {step.done && " · Done"}
                      </Label>
                      <p className={`mt-1 text-lead font-semibold ${step.done ? "text-smoke line-through" : ""}`}>{step.title}</p>
                      {step.detail && <p className="measure mt-1 text-body text-smoke">{step.detail}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <AgentStrip
        agent="Game plan agent"
        state={state}
        demo={demo}
        right={steps.length ? `Step ${pad(doneCount)}/${pad(steps.length)} done` : undefined}
      />

      {steps.length === 0 ? (
        <div className="flex flex-wrap items-center gap-6 py-10">
          <Button onClick={generate} disabled={busy}>
            {state === "thinking" ? "Thinking" : "Generate the game plan"}
          </Button>
          <button
            type="button"
            onClick={() => setEditing("new:VALIDATE")}
            className="text-body font-medium text-smoke hover:text-bone"
          >
            Or write it yourself
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <div className="h-px flex-1 bg-line">
            <motion.div
              className="h-px bg-signal"
              animate={{ width: `${(doneCount / steps.length) * 100}%` }}
              transition={{ duration: duration.base, ease: ease.outStrong }}
            />
          </div>
          <button type="button" onClick={generate} disabled={busy} className="text-small font-medium text-smoke hover:text-bone">
            {state === "thinking" ? "Regenerating" : "Regenerate the plan"}
          </button>
        </div>
      )}
      {error && <p className="label text-signal">{error}</p>}

      {(steps.length > 0 || editing?.startsWith("new:")) &&
        STAGES.map((stage, si) => {
          const inStage = steps.filter((s) => s.stage === stage);
          return (
            <section key={stage} className="grid grid-cols-1 gap-6 border-t border-line pt-8 md:grid-cols-[16rem_1fr]">
              <div>
                <Label>Stage {pad(si + 1)}</Label>
                <h2 className="type-display mt-2 text-title">{STAGE_COPY[stage].label}</h2>
                <p className="mt-2 text-small text-smoke">{STAGE_COPY[stage].line}</p>
              </div>
              <div className="flex flex-col">
                {inStage.length === 0 && editing !== `new:${stage}` && (
                  <p className="py-3 text-body text-smoke">Nothing here yet.</p>
                )}
                {inStage.map((step) => {
                  const num = numberOf.get(step.id)!;
                  return (
                    <motion.div
                      key={step.id}
                      layout={!reduce}
                      transition={{ duration: duration.base, ease: ease.outStrong }}
                      className="border-b border-line last:border-b-0"
                    >
                      {editing === step.id ? (
                        <StepForm
                          initial={step}
                          busy={busy}
                          onCancel={() => setEditing(null)}
                          onSave={(v) => run(() => updateStep(step.id, v), () => setEditing(null))}
                        />
                      ) : (
                        <StepRow
                          step={step}
                          num={num}
                          hubSlug={hub.slug}
                          busy={busy}
                          onToggle={() => run(() => toggleDone(step.id))}
                          onUp={() => run(() => moveStep(step.id, "up"))}
                          onDown={() => run(() => moveStep(step.id, "down"))}
                          onEdit={() => setEditing(step.id)}
                          onDelete={() => confirm(`Delete "${step.title}"?`) && run(() => deleteStep(step.id))}
                        />
                      )}
                    </motion.div>
                  );
                })}
                {editing === `new:${stage}` ? (
                  <StepForm
                    initial={{ stage, title: "", detail: "", needs: [] }}
                    busy={busy}
                    onCancel={() => setEditing(null)}
                    onSave={(v) => run(() => addStep(hub.id, v), () => setEditing(null))}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(`new:${stage}`)}
                    className="self-start py-3 text-small font-medium text-smoke hover:text-bone"
                  >
                    + Add a step
                  </button>
                )}
              </div>
            </section>
          );
        })}
    </div>
  );
}

function StepRow({
  step,
  num,
  hubSlug,
  busy,
  onToggle,
  onUp,
  onDown,
  onEdit,
  onDelete,
}: {
  step: StepView;
  num: number;
  hubSlug: string;
  busy: boolean;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ctl = "text-small font-medium text-smoke hover:text-bone disabled:opacity-40";
  return (
    <div className="group grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 py-5 md:grid-cols-[auto_1fr_auto]">
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-pressed={step.done}
        aria-label={step.done ? `Mark "${step.title}" not done` : `Mark "${step.title}" done`}
        className={`mt-1 flex size-6 items-center justify-center rounded-xs border transition-colors duration-(--duration-fast) ${
          step.done ? "border-signal bg-signal text-field" : "border-smoke hover:border-bone"
        }`}
      >
        {step.done && (
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.25" />
          </svg>
        )}
      </button>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <Label tone={step.done ? "smoke" : "bone"}>Step {pad(num)}</Label>
          {step.done && <Label tone="signal">Done</Label>}
        </div>
        <p
          className={`mt-1 text-lead font-semibold tracking-tight ${step.done ? "text-smoke line-through decoration-1" : ""}`}
        >
          {step.title}
        </p>
        {step.detail && <p className="measure mt-1 text-body text-smoke">{step.detail}</p>}
        {step.needs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {step.needs.map((need) => (
              <NeedTag key={need} need={need} hubSlug={hubSlug} stepId={step.id} />
            ))}
          </div>
        )}
      </div>
      <div className="col-start-2 flex items-start gap-4 transition-opacity duration-(--duration-fast) md:col-start-3 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <button type="button" className={ctl} onClick={onUp} disabled={busy} aria-label="Move up">
          ↑
        </button>
        <button type="button" className={ctl} onClick={onDown} disabled={busy} aria-label="Move down">
          ↓
        </button>
        <button type="button" className={ctl} onClick={onEdit} disabled={busy}>
          Edit
        </button>
        <button type="button" className={`${ctl} hover:text-signal`} onClick={onDelete} disabled={busy}>
          Delete
        </button>
      </div>
    </div>
  );
}

function StepForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: { stage: Stage; title: string; detail: string | null; needs: StepInput["needs"] };
  busy: boolean;
  onSave: (v: StepInput) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<StepInput>({ ...initial, detail: initial.detail ?? "" });
  return (
    <form
      className="flex flex-col gap-6 border border-line p-4 my-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
    >
      <TextInput autoFocus label="Step" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
      <TextArea label="What done looks like · Optional" value={v.detail ?? ""} onChange={(e) => setV({ ...v, detail: e.target.value })} />
      <div>
        <Label>Stage</Label>
        <div className="mt-2">
          <Chips
            options={STAGES}
            value={[v.stage]}
            onChange={(x) => x.length && setV({ ...v, stage: x.find((s) => s !== v.stage) ?? v.stage })}
            render={(s) => STAGE_COPY[s].label}
          />
        </div>
      </div>
      <div>
        <Label>Needs</Label>
        <div className="mt-2">
          <Chips options={NEED_TAGS} value={v.needs} onChange={(x) => setV({ ...v, needs: x })} render={(t) => NEEDS[t].label} />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving" : "Save step"}
        </Button>
        <button type="button" onClick={onCancel} className="text-body font-medium text-smoke hover:text-bone">
          Cancel
        </button>
      </div>
    </form>
  );
}
