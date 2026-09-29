"use client";

import { Check } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Chips } from "@/components/ui/Chips";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/cn";
import { FOCUS_AREAS, ROLE_CHOICES, type ProfileInput } from "@/lib/profile-schema";
import { completeOnboarding, saveStep } from "./actions";
import { ROLE_COPY, stepsFor, type Step } from "./steps";

type Values = Required<{
  [K in keyof ProfileInput]: ProfileInput[K] extends string | null | undefined ? string : ProfileInput[K];
}>;
type FlowValues = Omit<Values, "location">;

/** The fields each screen owns, so we only save what that screen changed. */
function fieldsFor(step: Step, v: FlowValues): Partial<ProfileInput> {
  switch (step.kind) {
    case "name":
      return { name: v.name, headline: v.headline };
    case "roles":
      return { roles: v.roles };
    case "reflect":
      return { [step.field]: v[step.field] };
    case "focus":
      return { focusAreas: v.focusAreas, [step.note]: v[step.note] };
    case "partner":
      return { partnerOrgName: v.partnerOrgName };
    case "contact":
      return { contactEmail: v.contactEmail, contactLink: v.contactLink };
  }
}

const required = (step: Step) => step.kind === "name" || step.kind === "roles";

export function OnboardingFlow({ initial, startAt }: { initial: FlowValues; startAt: number }) {
  const [v, setV] = useState<FlowValues>(initial);
  const steps = stepsFor(v.roles);
  const [index, setIndex] = useState(Math.min(startAt, steps.length));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const done = index >= steps.length;
  const step = steps[index];
  const set = <K extends keyof FlowValues>(k: K, val: FlowValues[K]) => setV((p) => ({ ...p, [k]: val }));

  function go(to: number) {
    setErrors({});
    setIndex(to);
  }

  function next(skip = false) {
    if (!step || pending) return;
    start(async () => {
      if (skip) {
        go(index + 1);
        return;
      }
      const res = await saveStep(fieldsFor(step, v), index + 1);
      if (res.ok) go(index + 1);
      else setErrors(res.errors);
    });
  }

  // Cmd/Ctrl + Enter continues from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const total = steps.length;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="h-0.5 w-full bg-bg-inset">
        <div
          className="h-full bg-primary transition-[width] duration-(--duration-slow) ease-out"
          style={{ width: `${(Math.min(index, total) / total) * 100}%` }}
        />
      </div>
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-[15px] font-semibold tracking-[0.18em]">SELF</span>
        <span className="font-mono text-xs text-fg-subtle">{done ? "Done" : `${index + 1} / ${total}`}</span>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pt-[10vh] pb-16">
        <div key={done ? "done" : step.id} className="w-full max-w-lg animate-[fade-in_var(--duration-slow)_ease-out]">
          {done ? (
            <Done name={v.name} />
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-balance">{step.lines.join(" ")}</h1>
              <p className="mt-2 text-md text-fg-muted">{step.helper}</p>
              <div className="mt-8 flex flex-col gap-5">
                <StepInput step={step} v={v} set={set} errors={errors} />
              </div>
              <div className="mt-10 flex items-center justify-between gap-4">
                <Button variant="ghost" onClick={() => go(index - 1)} disabled={index === 0 || pending} className={cn(index === 0 && "invisible")}>
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-1 text-xs text-fg-subtle md:flex">
                    <Kbd>⌘</Kbd>
                    <Kbd>↵</Kbd>
                  </span>
                  {!required(step) && (
                    <Button variant="ghost" onClick={() => next(true)}>
                      Skip for now
                    </Button>
                  )}
                  <Button variant="primary" size="md" onClick={() => next()} disabled={pending}>
                    {pending ? "Saving…" : "Continue"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StepInput({
  step,
  v,
  set,
  errors,
}: {
  step: Step;
  v: FlowValues;
  set: <K extends keyof FlowValues>(k: K, val: FlowValues[K]) => void;
  errors: Record<string, string>;
}) {
  switch (step.kind) {
    case "name":
      return (
        <>
          <Field label="Your name" error={errors.name}>
            <Input autoFocus className="h-10 text-md" value={v.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
          </Field>
          <Field label="One line about you" hint="Optional" error={errors.headline}>
            <Input
              placeholder="Ex-supply-chain lead, building in food waste"
              value={v.headline}
              onChange={(e) => set("headline", e.target.value)}
            />
          </Field>
        </>
      );
    case "roles":
      return (
        <div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ROLE_CHOICES.map((r) => {
              const on = v.roles.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("roles", on ? v.roles.filter((x) => x !== r) : [...v.roles, r])}
                  className={cn(
                    "flex flex-col gap-1 rounded-md border p-3 text-left transition-colors duration-(--duration-fast)",
                    on ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong hover:bg-bg-hover",
                  )}
                >
                  <span className="flex items-center justify-between text-base font-medium">
                    {ROLE_COPY[r].title}
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border",
                        on ? "border-primary bg-primary text-primary-fg" : "border-border-strong",
                      )}
                    >
                      {on && <Check className="size-3" />}
                    </span>
                  </span>
                  <span className="text-sm text-fg-muted">{ROLE_COPY[r].line}</span>
                </button>
              );
            })}
          </div>
          {errors.roles && <p className="mt-2 text-xs text-danger">{errors.roles}</p>}
        </div>
      );
    case "reflect":
      return (
        <Field error={errors[step.field]}>
          <Textarea
            autoFocus
            rows={5}
            className="text-md"
            placeholder={step.placeholder}
            value={v[step.field]}
            onChange={(e) => set(step.field, e.target.value)}
          />
        </Field>
      );
    case "focus":
      return (
        <>
          <Chips options={FOCUS_AREAS} value={v.focusAreas} onChange={(x) => set("focusAreas", x)} max={8} />
          <Field error={errors[step.note]}>
            <Textarea placeholder={step.placeholder} value={v[step.note]} onChange={(e) => set(step.note, e.target.value)} />
          </Field>
        </>
      );
    case "partner":
      return (
        <Field label="Firm or studio name" error={errors.partnerOrgName}>
          <Input
            autoFocus
            placeholder="Harbor & Vine Legal"
            value={v.partnerOrgName}
            onChange={(e) => set("partnerOrgName", e.target.value)}
          />
        </Field>
      );
    case "contact":
      return (
        <>
          <Field label="Email for introductions" hint="Only shared when you both say yes to connecting." error={errors.contactEmail}>
            <Input type="email" value={v.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field label="A link" hint="LinkedIn, a site, anything. Optional." error={errors.contactLink}>
            <Input type="url" placeholder="https://" value={v.contactLink} onChange={(e) => set("contactLink", e.target.value)} />
          </Field>
        </>
      );
  }
}

function Done({ name }: { name: string }) {
  const first = name.split(" ")[0] || "there";
  return (
    <form action={completeOnboarding}>
      <h1 className="text-2xl font-semibold tracking-tight">Thanks, {first}. What are you building?</h1>
      <p className="mt-2 text-md text-fg-muted">
        Everything you wrote stays editable on your profile. It also teaches your personal agent how you think.
      </p>
      <Button type="submit" variant="primary" size="md" className="mt-8">
        Take me in
      </Button>
    </form>
  );
}
