"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { Button } from "@/components/ui/ArrowLink";
import { Chips } from "@/components/ui/Chips";
import { TextArea, TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { duration, ease } from "@/design/motion";
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
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const reduce = useReducedMotion();

  const done = index >= steps.length;
  const step = steps[index];
  const set = <K extends keyof FlowValues>(k: K, val: FlowValues[K]) => setV((p) => ({ ...p, [k]: val }));

  function go(to: number) {
    setDir(to > index ? 1 : -1);
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
  const travel = reduce ? 0 : 48;

  return (
    <section className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      {/* Progress */}
      <div className="h-px w-full bg-line">
        <motion.div
          className="h-px bg-signal"
          animate={{ width: `${(Math.min(index, total) / total) * 100}%` }}
          transition={{ duration: duration.base, ease: ease.outStrong }}
        />
      </div>
      <div className="flex justify-between px-edge pt-6">
        <Label>Getting to know you</Label>
        <Label tone="bone">
          {done ? "Done" : `${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`}
        </Label>
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={done ? "done" : step.id}
          className="flex flex-1 flex-col justify-between gap-12 px-edge pt-12 pb-10"
          initial={{ opacity: 0, x: travel * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -travel * dir }}
          transition={{ duration: duration.fast, ease: ease.outStrong }}
        >
          {done ? (
            <Done name={v.name} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16">
                <div>
                  <MaskedLines lines={step.lines} as="h1" className="type-display text-prompt" />
                  <p className="measure mt-6 text-lead text-smoke">{step.helper}</p>
                </div>
                <div className="flex flex-col justify-end gap-8">
                  <StepInput step={step} v={v} set={set} errors={errors} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-6">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  disabled={index === 0 || pending}
                  className="text-body font-medium text-smoke transition-colors hover:text-bone disabled:invisible"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-6">
                  <span className="label hidden text-smoke md:inline">⌘ + Enter</span>
                  {!required(step) && (
                    <button
                      type="button"
                      onClick={() => next(true)}
                      className="text-body font-medium text-smoke transition-colors hover:text-bone"
                    >
                      Skip for now
                    </button>
                  )}
                  <Button onClick={() => next()} disabled={pending}>
                    {pending ? "Saving" : "Continue"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
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
          <TextInput
            autoFocus
            scale="title"
            label="Your name"
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
          />
          <TextInput
            label="One line about you · Optional"
            placeholder="Ex-supply-chain lead, building in food waste"
            value={v.headline}
            onChange={(e) => set("headline", e.target.value)}
            error={errors.headline}
          />
        </>
      );
    case "roles":
      return (
        <div>
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
            {ROLE_CHOICES.map((r) => {
              const on = v.roles.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("roles", on ? v.roles.filter((x) => x !== r) : [...v.roles, r])}
                  className={`group flex min-h-40 flex-col justify-between rounded-xs border p-4 text-left transition-colors duration-(--duration-fast) ${
                    on ? "border-bone bg-bone text-field" : "border-line hover:border-smoke"
                  }`}
                >
                  <Label tone={on ? "field" : "smoke"}>{on ? "Yes · That's me" : "Select"}</Label>
                  <span>
                    <span className="type-display block text-title transition-[--wdth] duration-(--duration-base) ease-out-strong group-hover:[--wdth:118]">
                      {ROLE_COPY[r].title}
                    </span>
                    <span className={`mt-2 block text-small ${on ? "text-field" : "text-smoke"}`}>{ROLE_COPY[r].line}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {errors.roles && <span className="label mt-3 block text-signal">{errors.roles}</span>}
        </div>
      );
    case "reflect":
      return (
        <TextArea
          autoFocus
          scale="title"
          placeholder={step.placeholder}
          value={v[step.field]}
          onChange={(e) => set(step.field, e.target.value)}
          error={errors[step.field]}
        />
      );
    case "focus":
      return (
        <>
          <Chips options={FOCUS_AREAS} value={v.focusAreas} onChange={(x) => set("focusAreas", x)} max={8} />
          <TextArea
            placeholder={step.placeholder}
            value={v[step.note]}
            onChange={(e) => set(step.note, e.target.value)}
            error={errors[step.note]}
          />
        </>
      );
    case "partner":
      return (
        <TextInput
          autoFocus
          scale="title"
          label="Firm or studio name"
          placeholder="Harbor & Vine Legal"
          value={v.partnerOrgName}
          onChange={(e) => set("partnerOrgName", e.target.value)}
          error={errors.partnerOrgName}
        />
      );
    case "contact":
      return (
        <>
          <TextInput
            type="email"
            scale="title"
            label="Email for introductions"
            value={v.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            error={errors.contactEmail}
          />
          <TextInput
            type="url"
            label="A link · LinkedIn, site, anything · Optional"
            placeholder="https://"
            value={v.contactLink}
            onChange={(e) => set("contactLink", e.target.value)}
            error={errors.contactLink}
          />
        </>
      );
  }
}

function Done({ name }: { name: string }) {
  const first = name.split(" ")[0] || "Good";
  return (
    <form action={completeOnboarding} className="flex flex-1 flex-col justify-between gap-12">
      <MaskedLines lines={[`Thanks, ${first}.`, "Now, what are", "you building?"]} className="type-display text-hero" />
      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-6">
        <p className="measure text-body text-smoke">
          Everything you wrote stays editable on your profile. Later, it teaches your personal agent how you think.
        </p>
        <Button type="submit">Take me in</Button>
      </div>
    </form>
  );
}
