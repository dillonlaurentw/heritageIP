"use client";

import { useState, useTransition } from "react";
import { createHubFromIdea, generateIdeas } from "../../actions";
import { AgentStrip, type AgentState } from "@/components/agents/AgentStrip";
import { Reveal } from "@/components/motion/Reveal";
import { Arrow, Button } from "@/components/ui/ArrowLink";
import { TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

type Idea = { name: string; oneLiner: string; whyYou: string; seed: string };

export function IdeaGenerator() {
  const [steer, setSteer] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [state, setState] = useState<AgentState>("idle");
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [picking, setPicking] = useState<string | null>(null);

  function run() {
    setState("thinking");
    setError(null);
    start(async () => {
      const res = await generateIdeas(steer);
      if (res.ok) {
        setIdeas(res.output.ideas);
        setDemo(res.demo);
        setState("done");
      } else {
        setError(res.message);
        setState("error");
      }
    });
  }

  function pick(idea: Idea) {
    setPicking(idea.name);
    start(() => createHubFromIdea(idea));
  }

  return (
    <div className="flex flex-col gap-8">
      <AgentStrip agent="Ideas agent" state={state} demo={demo} right={ideas.length ? `${ideas.length} ideas` : undefined} />

      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_auto]">
        <TextInput
          label="Anything to steer it? · Optional"
          placeholder="Something in food. Nothing that needs VC money."
          value={steer}
          onChange={(e) => setSteer(e.target.value)}
        />
        <Button onClick={run} disabled={pending}>
          {state === "thinking" ? "Thinking" : ideas.length ? "Show me different ones" : "Show me ideas"}
        </Button>
      </div>
      {error && <p className="label text-signal">{error}</p>}

      {ideas.length > 0 && (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          {ideas.map((idea, i) => (
            <Reveal key={`${idea.name}-${i}`} index={i}>
              <button
                type="button"
                disabled={pending}
                onClick={() => pick(idea)}
                className={`group flex min-h-80 w-full flex-col justify-between rounded-xs p-5 text-left transition-colors duration-(--duration-fast) disabled:opacity-60 ${
                  i === 0 ? "bg-bone text-field" : "bg-field-raised text-bone hover:bg-field-raised/70"
                }`}
              >
                <span className="flex justify-between">
                  <Label tone={i === 0 ? "field" : "smoke"}>Idea {String(i + 1).padStart(2, "0")}</Label>
                  <Label tone={i === 0 ? "field" : "signal"}>{picking === idea.name ? "Creating hub" : "Build this"}</Label>
                </span>
                <span>
                  <span className="type-display block text-headline transition-[--wdth] duration-(--duration-base) ease-out-strong group-hover:[--wdth:115]">
                    {idea.name}
                  </span>
                  <span className="mt-3 block text-lead font-medium">{idea.oneLiner}</span>
                  <span className={`mt-3 block text-body ${i === 0 ? "" : "text-smoke"}`}>{idea.whyYou}</span>
                  <span className="mt-5 inline-block text-body font-semibold">
                    Start a hub with this <Arrow />
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
