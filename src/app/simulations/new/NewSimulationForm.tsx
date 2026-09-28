"use client";

import { useState, useTransition } from "react";
import { createSimulation } from "../actions";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea, TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import type { EligiblePerson } from "@/lib/simulations";
import { SCENARIOS } from "@/lib/scenarios";
import { SIM_LIMITS } from "@/lib/simulation-rules";

export function NewSimulationForm({
  people,
  hubs,
  meOptedIn,
}: {
  people: EligiblePerson[];
  hubs: { id: string; name: string }[];
  meOptedIn: boolean;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [scenario, setScenario] = useState(SCENARIOS[0].key);
  const [customTitle, setCustomTitle] = useState("");
  const [customBrief, setCustomBrief] = useState("");
  const [hubId, setHubId] = useState<string | null>(hubs[0]?.id ?? null);
  const [turns, setTurns] = useState<number>(9);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const maxOthers = SIM_LIMITS.maxPeople - 1;

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < maxOthers ? [...p, id] : p));

  const tile = (on: boolean) =>
    `flex flex-col gap-3 rounded-xs border p-4 text-left transition-colors duration-(--duration-fast) ${on ? "border-bone bg-bone text-field" : "border-line hover:border-smoke"}`;

  return (
    <div className="flex flex-col gap-14 pb-32">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-2 self-start">
          <Label>01 · Who&apos;s in the room</Label>
          <p className="text-small text-smoke">You, plus up to {maxOthers}. Only people who&apos;ve opted in can be picked.</p>
        </div>
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-3">
          <div className={tile(true)}>
            <Label tone="field">You · Always in</Label>
            <span className="type-display text-title">Your agent</span>
            {!meOptedIn && <span className="label text-signal">Turn on simulations for your agent first</span>}
          </div>
          {people.map((p) => {
            const on = picked.includes(p.id);
            return (
              <button key={p.id} type="button" disabled={!p.optedIn} aria-pressed={on} onClick={() => toggle(p.id)} className={`${tile(on)} disabled:cursor-not-allowed disabled:opacity-40`}>
                <Label tone={on ? "field" : "smoke"}>{p.optedIn ? p.context.slice(0, 2).join(" · ") : "Hasn't opted in"}</Label>
                <span className="type-display text-title">{p.name}</span>
                {p.headline && <span className={`text-small ${on ? "" : "text-smoke"}`}>{p.headline}</span>}
              </button>
            );
          })}
          {people.length === 0 && (
            <p className="text-body text-smoke sm:col-span-2">
              No one yet. Simulations are for teammates, candidates and people you&apos;re connected to.
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-2 self-start">
          <Label>02 · The situation</Label>
          <p className="text-small text-smoke">A preset, or describe your own.</p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-3">
            {[...SCENARIOS, { key: "custom", title: "Your own", brief: "Describe a situation your team is actually facing." }].map((s) => (
              <button key={s.key} type="button" aria-pressed={scenario === s.key} onClick={() => setScenario(s.key)} className={tile(scenario === s.key)}>
                <span className="type-display text-title">{s.title}</span>
                <span className={`text-small ${scenario === s.key ? "" : "text-smoke"}`}>{s.brief}</span>
              </button>
            ))}
          </div>
          {scenario === "custom" && (
            <div className="flex flex-col gap-6">
              <TextInput label="Name it" placeholder="Hire a first salesperson or not" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
              <TextArea label="What's happening" placeholder="The situation, what's at stake, and what the team has to decide." value={customBrief} onChange={(e) => setCustomBrief(e.target.value)} />
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
        <Label className="self-start">03 · Setup</Label>
        <div className="flex flex-wrap gap-8">
          {hubs.length > 0 && (
            <label className="block min-w-64">
              <Label>Hub for context · Optional</Label>
              <select
                value={hubId ?? ""}
                onChange={(e) => setHubId(e.target.value || null)}
                className="mt-2 w-full rounded-xs border border-line bg-field px-3 py-3 text-body text-bone"
              >
                <option value="">No hub</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div>
            <Label>Length</Label>
            <div className="mt-2 flex gap-2">
              {SIM_LIMITS.turnOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={turns === t}
                  onClick={() => setTurns(t)}
                  className={`rounded-xs border px-3 py-2 text-small font-medium ${turns === t ? "border-bone bg-bone text-field" : "border-line hover:border-smoke"}`}
                >
                  {t} turns
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-6 border-t border-line pt-6">
        <Button
          disabled={busy || !meOptedIn || picked.length === 0}
          onClick={() =>
            start(async () => {
              const res = await createSimulation({ participantIds: picked, scenarioKey: scenario, customTitle, customBrief, hubId, maxTurns: turns });
              if (res && !res.ok) setMsg(res.message);
            })
          }
        >
          {busy ? "Setting up" : "Run the simulation"}
        </Button>
        <span className="label text-smoke">
          Simulation · AI stand-ins, not the real people · {SIM_LIMITS.perUserPerDay} a day
        </span>
        {msg && <span className="label text-signal">{msg}</span>}
      </div>
    </div>
  );
}
