"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { generateIdeas } from "@/app/actions/thesis";
import { createWorkspaceAction } from "@/app/actions/workspaces";
import { AgentStatus, type AgentState } from "@/components/agents/AgentStatus";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Idea = { name: string; oneLiner: string; whyYou: string; seed: string };

export function IdeaPicker({ live, hasAnswers }: { live: boolean; hasAnswers: boolean }) {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [steer, setSteer] = useState("");
  const [state, setState] = useState<AgentState>("idle");
  const [demo, setDemo] = useState(!live);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const go = () => {
    setState("thinking");
    setError(null);
    start(async () => {
      const res = await generateIdeas(steer);
      if (!res.ok) {
        setState("error");
        setError(res.message);
        return;
      }
      setDemo(res.demo);
      setIdeas(res.output.ideas);
      setState("done");
    });
  };

  const pick = (i: Idea) =>
    start(async () => {
      const form = new FormData();
      form.set("name", i.name);
      form.set("oneLiner", i.oneLiner);
      form.set("rawIdea", i.seed);
      const res = await createWorkspaceAction({}, form);
      if (res?.errors) setError(Object.values(res.errors)[0] ?? "Couldn't create that.");
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl bg-surface shadow-card p-4">
        <AgentStatus name="Ideas agent" state={state} demo={demo} />
        {!hasAnswers && (
          <p className="mt-3 text-sm text-fg-muted">
            Your profile is thin, so the ideas will be too.{" "}
            <Link href="/me" className="text-fg underline underline-offset-2">
              Answer a few questions on your profile
            </Link>{" "}
            first for better ones.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Input value={steer} onChange={(e) => setSteer(e.target.value)} placeholder="Anything to steer it? e.g. “something in food, not software”" className="h-9" />
        <Button variant="primary" size="md" onClick={go} disabled={busy} className="h-9">
          {state === "thinking" ? "Thinking…" : ideas ? "More ideas" : "Suggest ideas"}
        </Button>
      </div>

      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {ideas && (
        <ul className="flex flex-col gap-3">
          {ideas.map((i) => (
            <li key={i.name} className="flex flex-col gap-2 rounded-xl bg-surface shadow-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-semibold">{i.name}</span>
                <Button size="sm" onClick={() => pick(i)} disabled={busy}>
                  Start with this <ArrowRight className="size-3.5" />
                </Button>
              </div>
              <p className="text-base">{i.oneLiner}</p>
              <p className="text-sm text-fg-muted">
                <span className="font-medium text-fg">Why you:</span> {i.whyYou}
              </p>
              <p className="border-l-2 border-border-strong pl-3 text-sm text-fg-muted">{i.seed}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
