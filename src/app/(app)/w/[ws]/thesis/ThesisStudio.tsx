"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ComponentProps } from "react";
import { askQuestions, draftThesis, newDialogue, saveThesis } from "@/app/actions/thesis";
import { FlowSteps } from "@/components/flow/FlowSteps";
import { AgentMark } from "@/components/ui/AgentMark";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow, NeedsDot } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
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
  hasSelf: boolean;
};

const DONT_KNOW = "I don't know yet.";

/** A textarea that looks like text until you click it: "edit any line directly". */
function Bare({ className, ...rest }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={1}
      className={cn(
        "w-full resize-none rounded-md bg-transparent [field-sizing:content] outline-none hover:bg-bg-hover focus:bg-bg-inset focus:px-2 focus:py-1",
        className,
      )}
      {...rest}
    />
  );
}

/** Questions one at a time, then a draft you edit, then "use this and plan it". Nothing is saved before that. */
export function ThesisStudio(init: Props) {
  const router = useRouter();
  const [answered, setAnswered] = useState<QA[]>(init.answered);
  const [pastRounds, setPastRounds] = useState<Round[]>(init.pastRounds);
  const [pending, setPending] = useState<Round | null>(init.pending);
  const [answers, setAnswers] = useState<string[]>(init.pending?.questions.map(() => "") ?? []);
  const [qi, setQi] = useState(0);
  const [draft, setDraft] = useState<ThesisInput | null>(init.draft);
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
    setError(null);
    start(async () => {
      const res = await askQuestions(init.workspace.id, qa);
      if (!res.ok) return setError(res.message);
      commitPending(qa);
      setDraft(null);
      setDemo(res.demo);
      setPending({ round: res.round, reflection: res.output.reflection, questions: res.output.questions });
      setAnswers(res.output.questions.map(() => ""));
      setQi(0);
    });
  };

  const makeDraft = () => {
    const qa = allQA();
    setError(null);
    start(async () => {
      const res = await draftThesis(init.workspace.id, qa);
      if (!res.ok) return setError(res.message);
      commitPending(qa);
      setDemo(res.demo);
      setDraft(res.output);
    });
  };

  const use = () =>
    start(async () => {
      if (!draft) return;
      const res = await saveThesis(init.workspace.id, draft);
      if (!res.ok) {
        setErrors(res.errors);
        setError("A few parts are empty. Fill them in, then use it.");
        return;
      }
      router.push(`/w/${init.workspace.slug}/plan` as Route);
    });

  const startOver = () =>
    start(async () => {
      await newDialogue(init.workspace.id);
      setAnswered([]);
      setPastRounds([]);
      setPending(null);
      setDraft(null);
      setQi(0);
    });

  const answer = (v: string) => setAnswers((a) => a.map((x, j) => (j === qi ? v : x)));
  const next = (v?: string) => {
    if (v !== undefined) answer(v);
    if (pending && qi < pending.questions.length - 1) setQi(qi + 1);
  };
  const lastQuestion = pending ? qi === pending.questions.length - 1 : false;
  const answeredSoFar = [...answered, ...(pending ? pending.questions.slice(0, qi).map((q, i) => ({ question: q, answer: answers[i] ?? "" })) : [])].filter(
    (a) => a.answer.trim(),
  );

  // ── The draft ──────────────────────────────────────────────
  if (draft) {
    const set = (k: keyof ThesisInput, v: string) => setDraft({ ...draft, [k]: v });
    return (
      <>
      <FlowSteps current="Thesis" className="mb-8" />
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_22rem]">
        <Card lift className="flex flex-col gap-7 px-8 py-9 md:px-12 md:py-11">
          <span className="text-sm text-fg-subtle">
            {init.workspace.name} · thesis{demo && " · demo agent"}
          </span>
          <Bare
            aria-label="The thesis, in a sentence or two"
            value={draft.statement}
            onChange={(e) => set("statement", e.target.value)}
            className={cn("text-3xl leading-tight font-medium tracking-tight", errors.statement && "bg-danger-soft")}
          />
          <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
            {THESIS_FIELDS.filter((f) => f.key !== "contrarian").map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-sm text-fg-subtle">{f.key === "whyUs" ? "Why you" : f.label}</span>
                <Bare
                  value={draft[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className={cn("text-md leading-relaxed", errors[f.key] && "bg-danger-soft")}
                />
              </label>
            ))}
          </div>
          <label className="flex flex-col gap-1.5 rounded-lg bg-bg px-5 py-4">
            <span className="text-sm text-fg-subtle">What you believe that others don&apos;t</span>
            <Bare
              value={draft.contrarian}
              onChange={(e) => set("contrarian", e.target.value)}
              className={cn("text-md leading-relaxed", errors.contrarian && "bg-danger-soft")}
            />
          </label>
          {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          {init.editable && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="lg" onClick={use} disabled={busy}>
                {busy ? "Saving…" : "Use this and plan it"}
              </Button>
              {roundsLeft > 0 && (
                <Button size="lg" onClick={ask} disabled={busy}>
                  Push on it more
                </Button>
              )}
              <span className="text-sm text-fg-subtle">or edit any line directly</span>
            </div>
          )}
        </Card>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Eyebrow>Still unproven</Eyebrow>
          {draft.openQuestions.map((q, i) => (
            <Card key={i} className="flex items-start gap-3 px-5 py-4">
              <NeedsDot className="mt-2" />
              <Bare
                aria-label={`Unproven ${i + 1}`}
                value={q}
                onChange={(e) => setDraft({ ...draft, openQuestions: draft.openQuestions.map((x, j) => (j === i ? e.target.value : x)) })}
                className="text-base font-medium"
              />
            </Card>
          ))}
          <p className="text-sm text-fg-muted">These become the first steps of your plan.</p>
          <div className="mt-2 flex flex-col gap-1.5 rounded-xl px-5 py-4 shadow-[inset_0_0_0_1px_var(--border)]">
            <span className="text-base font-medium">{init.hasSelf ? "Your Self shaped this" : "Built from your own words"}</span>
            <p className="text-sm leading-relaxed text-fg-muted">
              “Why you” and the belief line come from what you told SELF about why you build.{" "}
              <Link href="/me/self" className="text-fg underline underline-offset-2 hover:text-accent-text">
                See your Self
              </Link>
            </p>
          </div>
          {started && init.editable && (
            <button type="button" onClick={startOver} disabled={busy} className="mt-2 flex items-center gap-1.5 self-start text-sm text-fg-subtle hover:text-fg">
              <RotateCcw className="size-3.5" /> Start over
            </button>
          )}
        </aside>
      </div>
      </>
    );
  }

  // ── One question at a time ─────────────────────────────────
  if (pending) {
    const q = pending.questions[qi]!;
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
        <FlowSteps current="Questions" className="mb-2" />
        <IdeaAndAgent idea={init.workspace.rawIdea} line={pending.reflection} demo={demo} />
        <Card lift className="flex flex-col gap-5 px-8 py-8 md:px-10">
          <span className="flex justify-between text-sm text-fg-subtle">
            <span>
              Question {qi + 1} of {pending.questions.length}
            </span>
            <span className="font-mono text-xs">
              round {pending.round} of {init.maxRounds}
            </span>
          </span>
          <h1 className="text-3xl leading-tight font-medium tracking-tight">{q}</h1>
          <textarea
            key={qi}
            aria-label="Your answer"
            autoFocus
            rows={4}
            value={answers[qi] ?? ""}
            onChange={(e) => answer(e.target.value)}
            disabled={!init.editable}
            placeholder="Say what you know, and what you're guessing."
            className="w-full resize-none rounded-lg bg-bg px-5 py-4 text-md leading-relaxed outline-none placeholder:text-fg-subtle focus:ring-2 focus:ring-accent-soft"
          />
          {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          {init.editable && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-5 text-sm text-fg-muted">
                {qi > 0 && (
                  <button type="button" onClick={() => setQi(qi - 1)} className="flex items-center gap-1 hover:text-fg">
                    <ArrowLeft className="size-3.5" /> Back
                  </button>
                )}
                {!lastQuestion && (
                  <>
                    <button type="button" onClick={() => next("")} className="hover:text-fg">
                      Skip this one
                    </button>
                    <button type="button" onClick={() => next(DONT_KNOW)} className="hover:text-fg">
                      I don&apos;t know yet
                    </button>
                  </>
                )}
              </span>
              {lastQuestion ? (
                <span className="flex flex-wrap gap-2">
                  {roundsLeft > 0 && (
                    <Button size="lg" onClick={ask} disabled={busy}>
                      Ask me more · {roundsLeft} left
                    </Button>
                  )}
                  <Button variant="primary" size="lg" onClick={makeDraft} disabled={busy}>
                    {busy ? "Thinking…" : "Draft my thesis"}
                  </Button>
                </span>
              ) : (
                <Button variant="primary" size="lg" onClick={() => next()}>
                  Next question
                </Button>
              )}
            </div>
          )}
        </Card>

        {answeredSoFar.length > 0 && (
          <div className="flex flex-col gap-2">
            <Eyebrow>Answered</Eyebrow>
            {answeredSoFar.map((a, i) => (
              <Card key={i} className="flex flex-col gap-1 px-5 py-3.5 md:flex-row md:gap-5">
                <span className="shrink-0 text-sm text-fg-subtle md:w-56">{a.question}</span>
                <span className="text-base leading-relaxed">{a.answer}</span>
              </Card>
            ))}
          </div>
        )}
        {init.editable && !lastQuestion && (
          <button type="button" onClick={makeDraft} disabled={busy} className="self-end text-sm text-fg-muted hover:text-fg">
            Enough questions, draft my thesis
          </button>
        )}
      </div>
    );
  }

  // ── Before the first question ──────────────────────────────
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <FlowSteps current="Questions" className="mb-2" />
      <IdeaAndAgent
        idea={init.workspace.rawIdea}
        line={
          init.thesis
            ? "You have a thesis. Let's push on the weakest part of it."
            : "There's something here. Three questions to find out if it holds, then a draft you can change."
        }
        demo={demo}
      />
      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      {init.editable ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" onClick={ask} disabled={busy}>
            {busy ? "Thinking…" : init.thesis ? "Sharpen it with SELF" : "Ask me the hard questions"}
          </Button>
          {!init.thesis && (
            <Button variant="ghost" size="lg" onClick={makeDraft} disabled={busy}>
              Skip to a draft
            </Button>
          )}
          {init.thesisHref && (
            <Link href={init.thesisHref as Route} className="text-sm text-fg-muted hover:text-fg">
              Back to the thesis
            </Link>
          )}
        </div>
      ) : (
        <p className="text-sm text-fg-muted">Only members can work on the thesis.</p>
      )}
    </div>
  );
}

function IdeaAndAgent({ idea, line, demo }: { idea: string; line: string; demo: boolean }) {
  return (
    <>
      {idea && (
        <div className="flex flex-col gap-1.5 rounded-xl px-5 py-4 shadow-[inset_0_0_0_1px_var(--border)]">
          <span className="text-xs text-fg-subtle">Your idea</span>
          <span className="text-md leading-relaxed text-fg-muted">{idea}</span>
        </div>
      )}
      <div className="flex items-start gap-3.5">
        <AgentMark mark="St" size="lg" label="Strategist agent" />
        <p className="pt-2 text-lg leading-relaxed text-fg-muted">
          {line}
          {demo && <span className="ml-2 text-xs text-fg-subtle">demo agent</span>}
        </p>
      </div>
    </>
  );
}
