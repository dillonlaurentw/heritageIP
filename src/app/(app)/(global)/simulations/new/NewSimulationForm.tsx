"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { createSimulation } from "@/app/actions/simulations";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { SCENARIOS } from "@/lib/scenarios";
import { SIM_LIMITS } from "@/lib/simulation-rules";

type Person = { id: string; name: string; headline: string | null; optedIn: boolean; context: string[] };

export function NewSimulationForm({ people, workspaces }: { people: Person[]; workspaces: { id: string; name: string }[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [scenario, setScenario] = useState(SCENARIOS[0].key);
  const [customTitle, setCustomTitle] = useState("");
  const [customBrief, setCustomBrief] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(workspaces[0]?.id ?? null);
  const [turns, setTurns] = useState<number>(9);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const maxOthers = SIM_LIMITS.maxPeople - 1;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < maxOthers ? [...p, id] : p));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Who&apos;s in the room</h2>
        <p className="text-sm text-fg-muted">You, plus up to {maxOthers}. Teammates, candidates and people you&apos;re connected to. Only people who&apos;ve opted in can be picked.</p>
        {people.length === 0 ? (
          <p className="text-sm text-fg-subtle">Nobody to pick yet: invite a teammate, or connect with someone on the Network.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl bg-surface shadow-card">
            {people.map((p) => {
              const on = picked.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={!p.optedIn}
                    aria-pressed={on}
                    onClick={() => toggle(p.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-sm border", on ? "border-primary bg-primary text-primary-fg" : "border-border-strong")}>
                      {on && <Check className="size-3" />}
                    </span>
                    <Avatar name={p.name} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-fg-muted">{p.optedIn ? p.context.slice(0, 2).join(" · ") : "Hasn't opted in"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">The scenario</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...SCENARIOS, { key: "custom", title: "Your own", brief: "Describe the situation you want to rehearse." }].map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={scenario === s.key}
              onClick={() => setScenario(s.key)}
              className={cn("flex flex-col gap-1 rounded-lg border p-3 text-left", scenario === s.key ? "border-accent bg-accent-soft" : "border-border hover:bg-bg-hover")}
            >
              <span className="text-sm font-medium">{s.title}</span>
              <span className="line-clamp-2 text-xs text-fg-muted">{s.brief}</span>
            </button>
          ))}
        </div>
        {scenario === "custom" && (
          <div className="mt-2 flex flex-col gap-3">
            <Field label="Title">
              <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Deciding whether to take the grant" />
            </Field>
            <Field label="The situation">
              <Textarea rows={3} value={customBrief} onChange={(e) => setCustomBrief(e.target.value)} />
            </Field>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {workspaces.length > 0 && (
          <Field label="Company context" hint="The agents know its name and thesis statement.">
            <Select value={workspaceId ?? ""} onChange={(e) => setWorkspaceId(e.target.value || null)}>
              <option value="">None</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Length">
          <Select value={turns} onChange={(e) => setTurns(Number(e.target.value))}>
            {SIM_LIMITS.turnOptions.map((t) => (
              <option key={t} value={t}>
                {t} turns
              </option>
            ))}
          </Select>
        </Field>
      </section>

      {msg && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{msg}</p>}
      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button
          variant="primary"
          size="md"
          disabled={busy || picked.length === 0}
          onClick={() =>
            start(async () => {
              setMsg(null);
              const res = await createSimulation({ participantIds: picked, scenarioKey: scenario, customTitle, customBrief, workspaceId, maxTurns: turns });
              if (res && !res.ok) setMsg(res.message);
            })
          }
        >
          {busy ? "Setting up…" : "Start the simulation"}
        </Button>
        <span className="text-xs text-fg-subtle">Labelled SIMULATION everywhere. Everyone in it can read the transcript.</span>
      </div>
    </div>
  );
}
