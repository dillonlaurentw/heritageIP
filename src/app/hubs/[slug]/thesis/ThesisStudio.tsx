"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { askQuestions, draftThesis, newDialogue, saveThesis } from "./actions";
import { AgentStrip, type AgentState } from "@/components/agents/AgentStrip";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { THESIS_FIELDS, type ThesisInput } from "@/lib/thesis-schema";

export type QA = { question: string; answer: string };
export type Round = { round: number; reflection: string; questions: string[] };

export type StudioInit = {
  hub: { id: string; slug: string; name: string; rawIdea: string };
  thesis: ThesisInput | null;
  answered: QA[];
  pastRounds: Round[];
  pending: Round | null;
  draft: ThesisInput | null;
  maxRounds: number;
  live: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function ThesisStudio(init: StudioInit) {
  const router = useRouter();
  const [answered, setAnswered] = useState<QA[]>(init.answered);
  const [pastRounds, setPastRounds] = useState<Round[]>(init.pastRounds);
  const [pending, setPending] = useState<Round | null>(init.pending);
  const [answers, setAnswers] = useState<string[]>(init.pending?.questions.map(() => "") ?? []);
  const [draft, setDraft] = useState<ThesisInput | null>(init.draft);
  const [state, setState] = useState<AgentState>("idle");
  const [demo, setDemo] = useState(!init.live);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const roundsUsed = pastRounds.length + (pending ? 1 : 0);
  const roundsLeft = init.maxRounds - roundsUsed;
  const dialogueStarted = roundsUsed > 0 || draft !== null;

  /** Answers so far, including the round on screen. */
  function allQA(): QA[] {
    if (!pending) return answered;
    return [...answered, ...pending.questions.map((q, i) => ({ question: q, answer: answers[i] ?? "" }))];
  }

  function commitPending(qa: QA[]) {
    if (pending) setPastRounds((r) => [...r, pending]);
    setAnswered(qa);
    setPending(null);
    setAnswers([]);
  }

  function ask() {
    const qa = allQA();
    setState("thinking");
    setError(null);
    start(async () => {
      const res = await askQuestions(init.hub.id, qa);
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
  }

  function makeDraft() {
    const qa = allQA();
    setState("thinking");
    setError(null);
    start(async () => {
      const res = await draftThesis(init.hub.id, qa);
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
  }

  function startOver() {
    start(async () => {
      await newDialogue(init.hub.id);
      setAnswered([]);
      setPastRounds([]);
      setPending(null);
      setDraft(null);
      setState("idle");
    });
  }

  const thinking = state === "thinking";

  return (
    <div className="flex flex-col gap-10">
      <AgentStrip
        agent="Thesis agent"
        state={state}
        demo={demo}
        right={`Round ${pad(Math.max(roundsUsed, 1))}/${pad(init.maxRounds)}`}
      />

      {/* The thought it started from */}
      <div className="grid grid-cols-1 gap-4 border-b border-line pb-10 md:grid-cols-[14rem_1fr]">
        <Label>The thought</Label>
        <p className="measure text-lead">{init.hub.rawIdea}</p>
      </div>

      {/* Earlier rounds, compact */}
      {pastRounds.map((r, ri) => (
        <div key={r.round} className="grid grid-cols-1 gap-4 border-b border-line pb-10 md:grid-cols-[14rem_1fr]">
          <Label>Round {pad(r.round)}</Label>
          <div className="flex flex-col gap-5">
            <p className="text-lead text-smoke">{r.reflection}</p>
            {r.questions.map((q, i) => {
              const a = answered[pastRounds.slice(0, ri).reduce((n, x) => n + x.questions.length, 0) + i]?.answer;
              return (
                <div key={i}>
                  <p className="text-body font-semibold">{q}</p>
                  <p className="mt-1 text-body text-smoke">{a?.trim() || "Skipped"}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Current round */}
      {pending && (
        <Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[14rem_1fr]">
            <Label tone="signal">SELF · Round {pad(pending.round)}</Label>
            <div className="flex flex-col gap-10">
              <p className="type-display max-w-[28ch] text-title">{pending.reflection}</p>
              {pending.questions.map((q, i) => (
                <div key={i}>
                  <Label>Question {pad(i + 1)}</Label>
                  <p className="mt-2 max-w-[40ch] text-lead font-semibold">{q}</p>
                  <TextArea
                    placeholder="Answer in your own words. Skip if you don't know yet."
                    value={answers[i] ?? ""}
                    onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {error && <p className="label text-signal">{error}</p>}

      {/* Draft or saved thesis */}
      {draft ? (
        <Reveal>
          <ThesisEditor
            key={JSON.stringify(draft)}
            hubId={init.hub.id}
            initial={draft}
            source="AGENT"
            onSaved={() => router.push(`/hubs/${init.hub.slug}`)}
            extra={
              roundsLeft > 0 && (
                <Button variant="ghost" onClick={ask} disabled={busy}>
                  Push on it more
                </Button>
              )
            }
          />
        </Reveal>
      ) : (
        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
          {!pending && !dialogueStarted && (
            <Button onClick={ask} disabled={busy}>
              {thinking ? "Thinking" : init.thesis ? "Sharpen it with SELF" : "Ask me the hard questions"}
            </Button>
          )}
          {pending && (
            <>
              <Button onClick={makeDraft} disabled={busy}>
                {thinking ? "Thinking" : "Draft my thesis"}
              </Button>
              {roundsLeft > 0 && (
                <Button variant="ghost" onClick={ask} disabled={busy}>
                  Ask me more · {roundsLeft} left
                </Button>
              )}
            </>
          )}
          {!pending && !dialogueStarted && !init.thesis && (
            <button type="button" onClick={makeDraft} disabled={busy} className="text-body font-medium text-smoke hover:text-bone">
              Skip to a draft
            </button>
          )}
        </div>
      )}

      {dialogueStarted && (
        <button
          type="button"
          onClick={startOver}
          disabled={busy}
          className="self-start text-small font-medium text-smoke hover:text-bone"
        >
          Start the dialogue over
        </button>
      )}

      {/* Editing an existing thesis by hand */}
      {init.thesis && !draft && !pending && (
        <div className="border-t border-line pt-10">
          <Label>Or edit it by hand</Label>
          <div className="mt-8">
            <ThesisEditor
              hubId={init.hub.id}
              initial={init.thesis}
              source="EDIT"
              onSaved={() => router.push(`/hubs/${init.hub.slug}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ThesisEditor({
  hubId,
  initial,
  source,
  onSaved,
  extra,
}: {
  hubId: string;
  initial: ThesisInput;
  source: "AGENT" | "EDIT";
  onSaved: () => void;
  extra?: React.ReactNode;
}) {
  const [v, setV] = useState<ThesisInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, start] = useTransition();
  const set = (k: keyof ThesisInput, val: string) => setV((p) => ({ ...p, [k]: val }));

  function save() {
    start(async () => {
      const res = await saveThesis(hubId, v, source);
      if (res.ok) onSaved();
      else setErrors(res.errors);
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Label tone={source === "AGENT" ? "signal" : "smoke"}>
          {source === "AGENT" ? "Draft · Edit anything before you save" : "Your thesis"}
        </Label>
        <TextArea
          scale="title"
          label="The thesis in a sentence"
          value={v.statement}
          onChange={(e) => set("statement", e.target.value)}
          error={errors.statement}
          className="mt-4"
        />
      </div>
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
        {THESIS_FIELDS.map((f) => (
          <TextArea
            key={f.key}
            label={f.label}
            hint={f.hint}
            value={v[f.key]}
            onChange={(e) => set(f.key, e.target.value)}
            error={errors[f.key]}
          />
        ))}
      </div>
      {v.openQuestions.length > 0 && (
        <div className="border-l-2 border-signal pl-5">
          <Label tone="signal">Still open</Label>
          <ul className="mt-3 flex flex-col gap-2">
            {v.openQuestions.map((q, i) => (
              <li key={i} className="text-lead">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving" : "Save thesis"}
        </Button>
        {extra}
        {Object.keys(errors).length > 0 && <span className="label text-signal">Fill in the fields marked above</span>}
      </div>
    </div>
  );
}
