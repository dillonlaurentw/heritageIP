"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { askQuestions, draftThesis, newDialogue, saveThesis } from "@/app/actions/thesis";
import { AgentStatus, type AgentState } from "@/components/agents/AgentStatus";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Input";
import { THESIS_FIELDS, type ThesisInput } from "@/lib/thesis-doc";

export type QA = { question: string; answer: string };
export type Round = { round: number; reflection: string; questions: string[] };

type Props = {
  workspace: { id: string; slug: string; name: string; rawIdea: string };
  thesis: ThesisInput | null;
  thesisHref: string | null;
  answered: QA[];
  pastRounds: Round[];
  pending: Round | null;
  draft: ThesisInput | null;
  maxRounds: number;
  live: boolean;
  editable: boolean;
};

/** Question rounds, then a draft the builder edits and chooses to use. */
export function ThesisStudio(init: Props) {
  const router = useRouter();
  const [answered, setAnswered] = useState<QA[]>(init.answered);
  const [pastRounds, setPastRounds] = useState<Round[]>(init.pastRounds);
  const [pending, setPending] = useState<Round | null>(init.pending);
  const [answers, setAnswers] = useState<string[]>(init.pending?.questions.map(() => "") ?? []);
  const [draft, setDraft] = useState<ThesisInput | null>(init.draft);
  const [state, setState] = useState<AgentState>("idle");
  const [demo, setDemo] = useState(!init.live);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, start] = useTransition();

  const roundsUsed = pastRounds.length + (pending ? 1 : 0);
  const roundsLeft = init.maxRounds - roundsUsed;
  const started = roundsUsed > 0 || draft !== null;

  const allQA = (): QA[] =>
    pending ? [...answered, ...pending.questions.map((q, i) => ({ question: q, answer: answers[i] ?? "" }))] : answered;

  const commitPending = (qa: QA[]) => {
    if (pending) setPastRounds((r) => [...r, pending]);
    setAnswered(qa);
    setPending(null);
    setAnswers([]);
  };

  const ask = () => {
    const qa = allQA();
    setState("thinking");
    setError(null);
    start(async () => {
      const res = await askQuestions(init.workspace.id, qa);
      if (!res.ok) {
        setState("error");
        setError(res.message);
        return;
      }
      commitPending(qa);
      setDraft(null);
      setDemo(res.demo);
      setPending({ round: res.round, reflection: res.output.reflection, questions: res.output.questions });
      setAnswers(res.output.questions.map(() => ""));
      setState("done");
    });
  };

  const makeDraft = () => {
    const qa = allQA();
    setState("thinking");
    setError(null);
    start(async () => {
      const res = await draftThesis(init.workspace.id, qa);
      if (!res.ok) {
        setState("error");
        setError(res.message);
        return;
      }
      commitPending(qa);
      setDemo(res.demo);
      setDraft(res.output);
      setState("done");
    });
  };

  const use = () =>
    start(async () => {
      if (!draft) return;
      const res = await saveThesis(init.workspace.id, draft);
      if (!res.ok) {
        setErrors(res.errors);
        setError("Fill in the fields marked below.");
        return;
      }
      router.push(res.href as Route);
    });

  const startOver = () =>
    start(async () => {
      await newDialogue(init.workspace.id);
      setAnswered([]);
      setPastRounds([]);
      setPending(null);
      setDraft(null);
      setState("idle");
    });

  const thinking = state === "thinking";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{init.thesis ? "Sharpen the thesis" : "Write the thesis"}</h1>
        <p className="mt-1.5 text-base text-fg-muted">
          SELF asks the questions a sharp co-founder would, then drafts the thesis: the problem, who it&apos;s for, why now, why
          you, and what you believe that others don&apos;t. You edit it and decide.
        </p>
      </div>

      <div className="rounded-xl bg-surface shadow-card p-4">
        <AgentStatus name="Thesis agent" state={state} demo={demo} right={`Round ${Math.max(roundsUsed, 1)}/${init.maxRounds}`} />
        {init.workspace.rawIdea && (
          <blockquote className="mt-4 border-l-2 border-border-strong pl-3 text-md text-fg-muted">{init.workspace.rawIdea}</blockquote>
        )}
      </div>

      {pastRounds.map((r) => (
        <details key={r.round} className="rounded-xl bg-surface shadow-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Round {r.round}</summary>
          <p className="mt-3 text-sm text-fg-muted">{r.reflection}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {r.questions.map((q, i) => {
              const a = answered.find((x) => x.question === q);
              return (
                <li key={i} className="text-sm">
                  <p className="font-medium">{q}</p>
                  <p className="mt-0.5 text-fg-muted">{a?.answer?.trim() || "Skipped"}</p>
                </li>
              );
            })}
          </ul>
        </details>
      ))}

      {pending && (
        <section className="flex flex-col gap-5">
          <p className="rounded-lg bg-bg-subtle px-4 py-3 text-md">{pending.reflection}</p>
          {pending.questions.map((q, i) => (
            <Field key={i} label={q}>
              <Textarea
                rows={3}
                value={answers[i] ?? ""}
                onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="Answer in your own words. Skip if you don't know yet."
                disabled={!init.editable}
              />
            </Field>
          ))}
        </section>
      )}

      {draft && (
        <section className="flex flex-col gap-4 rounded-lg border border-accent/40 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">The draft</h2>
            <span className="text-xs text-fg-subtle">Nothing is saved until you choose “Use this”.</span>
          </div>
          <Field label="The thesis, in a sentence or two" error={errors.statement}>
            <Textarea rows={3} className="text-md font-medium" value={draft.statement} onChange={(e) => setDraft({ ...draft, statement: e.target.value })} />
          </Field>
          {THESIS_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint} error={errors[f.key]}>
              <Textarea rows={3} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            </Field>
          ))}
          <Field label="Open questions" hint="One per line: what's still unproven.">
            <Textarea
              rows={3}
              value={draft.openQuestions.join("\n")}
              onChange={(e) => setDraft({ ...draft, openQuestions: e.target.value.split("\n").slice(0, 6) })}
            />
          </Field>
        </section>
      )}

      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {init.editable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
          {draft ? (
            <>
              <Button variant="primary" size="md" onClick={use} disabled={busy}>
                Use this <ArrowRight className="size-4" />
              </Button>
              {roundsLeft > 0 && (
                <Button size="md" onClick={ask} disabled={busy}>
                  {thinking ? "Thinking…" : "Push on it more"}
                </Button>
              )}
            </>
          ) : pending ? (
            <>
              <Button variant="primary" size="md" onClick={makeDraft} disabled={busy}>
                {thinking ? "Thinking…" : "Draft my thesis"}
              </Button>
              {roundsLeft > 0 && (
                <Button size="md" onClick={ask} disabled={busy}>
                  Ask me more · {roundsLeft} left
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="primary" size="md" onClick={ask} disabled={busy}>
                {thinking ? "Thinking…" : init.thesis ? "Sharpen it with SELF" : "Ask me the hard questions"}
              </Button>
              {!init.thesis && (
                <Button variant="ghost" size="md" onClick={makeDraft} disabled={busy}>
                  Skip to a draft
                </Button>
              )}
            </>
          )}
          <span className="flex-1" />
          {started && (
            <Button variant="ghost" onClick={startOver} disabled={busy}>
              <RotateCcw className="size-3.5" /> Start over
            </Button>
          )}
          {init.thesisHref && (
            <Link href={init.thesisHref as Route} className="text-sm text-fg-muted hover:text-fg">
              Back to the thesis
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
