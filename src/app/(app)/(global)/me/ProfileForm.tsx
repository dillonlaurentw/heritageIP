"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { saveProfile } from "@/app/actions/profile";
import { ROLE_COPY } from "@/app/onboarding/steps";
import { Button } from "@/components/ui/Button";
import { Chips } from "@/components/ui/Chips";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { FOCUS_AREAS, ROLE_CHOICES, type ProfileInput } from "@/lib/profile-schema";

type V = {
  [K in keyof ProfileInput]: ProfileInput[K] extends string | null | undefined ? string : ProfileInput[K];
};

const REFLECT: { field: "beliefs" | "workStyle" | "buildingToward" | "strengths" | "gaps" | "decisionStyle"; label: string }[] = [
  { field: "beliefs", label: "What you believe that most people don't" },
  { field: "workStyle", label: "How you work when it's going well" },
  { field: "buildingToward", label: "What you're building toward" },
  { field: "strengths", label: "What you're strong at" },
  { field: "gaps", label: "Where you need other people" },
  { field: "decisionStyle", label: "How you make hard calls" },
];

/** Profile, in sections. Each section saves on its own. */
export function ProfileForm({ initial }: { initial: V }) {
  const [v, setV] = useState<V>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const set = <K extends keyof V>(k: K, val: V[K]) => setV((p) => ({ ...p, [k]: val }));

  const save = (keys: (keyof V)[]) =>
    start(async () => {
      const fields = Object.fromEntries(keys.map((k) => [k, v[k]])) as Partial<ProfileInput>;
      const res = await saveProfile(fields);
      if (res.ok) {
        setErrors({});
        toast("Saved");
      } else setErrors(res.errors);
    });

  const has = (r: string) => (v.roles as string[]).includes(r);

  return (
    <div className="flex flex-col gap-10">
      <Section title="Basics" onSave={() => save(["name", "headline", "location", "roles"])} pending={pending}>
        <Field label="Name" error={errors.name}>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="One line about you" error={errors.headline}>
          <Input value={v.headline} onChange={(e) => set("headline", e.target.value)} placeholder="Ex-supply-chain lead, building in food waste" />
        </Field>
        <Field label="Where you're based" error={errors.location}>
          <Input value={v.location} onChange={(e) => set("location", e.target.value)} placeholder="Lisbon" />
        </Field>
        <Field label="What brings you here" error={errors.roles}>
          <Chips
            options={ROLE_CHOICES.map((r) => ROLE_COPY[r].title) as unknown as readonly string[]}
            value={(v.roles as string[]).map((r) => ROLE_COPY[r as keyof typeof ROLE_COPY].title)}
            onChange={(titles) =>
              set(
                "roles",
                ROLE_CHOICES.filter((r) => titles.includes(ROLE_COPY[r].title)) as V["roles"],
              )
            }
          />
        </Field>
      </Section>

      <Section
        title="How you think"
        hint="Your Self starts from these answers. You can change it line by line."
        extra={
          <Link href="/me/self" className="text-sm font-medium text-accent-text hover:underline">
            Your Self →
          </Link>
        }
        onSave={() => save(REFLECT.map((r) => r.field))}
        pending={pending}
      >
        {REFLECT.map((r) => (
          <Field key={r.field} label={r.label} error={errors[r.field]}>
            <Textarea rows={3} value={v[r.field]} onChange={(e) => set(r.field, e.target.value)} />
          </Field>
        ))}
      </Section>

      {(has("MENTOR") || has("BACKER")) && (
        <Section title="Mentoring and backing" onSave={() => save(["focusAreas", "mentorNote", "backerNote"])} pending={pending}>
          <Field label="Focus areas" hint="Up to 8." error={errors.focusAreas}>
            <Chips options={FOCUS_AREAS} value={v.focusAreas} onChange={(x) => set("focusAreas", x)} max={8} />
          </Field>
          {has("MENTOR") && (
            <Field label="What you help with, as a mentor" error={errors.mentorNote}>
              <Textarea rows={3} value={v.mentorNote} onChange={(e) => set("mentorNote", e.target.value)} />
            </Field>
          )}
          {has("BACKER") && (
            <Field label="What you back" hint="No amounts or terms. SELF is introductions only." error={errors.backerNote}>
              <Textarea rows={3} value={v.backerNote} onChange={(e) => set("backerNote", e.target.value)} />
            </Field>
          )}
        </Section>
      )}

      {has("PARTNER") && (
        <Section title="Your firm" onSave={() => save(["partnerOrgName"])} pending={pending}>
          <Field label="Firm or studio name" error={errors.partnerOrgName}>
            <Input value={v.partnerOrgName} onChange={(e) => set("partnerOrgName", e.target.value)} />
          </Field>
        </Section>
      )}

      <Section
        title="Contact details"
        hint="Only shared with someone after you both say yes to connecting."
        onSave={() => save(["contactEmail", "contactLink"])}
        pending={pending}
      >
        <Field label="Email for introductions" error={errors.contactEmail}>
          <Input type="email" value={v.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </Field>
        <Field label="A link" hint="LinkedIn, a site, anything." error={errors.contactLink}>
          <Input type="url" value={v.contactLink} onChange={(e) => set("contactLink", e.target.value)} placeholder="https://" />
        </Field>
      </Section>
    </div>
  );
}

function Section({
  title,
  hint,
  extra,
  children,
  onSave,
  pending,
}: {
  title: string;
  hint?: string;
  extra?: ReactNode;
  children: ReactNode;
  onSave: () => void;
  pending: boolean;
}) {
  return (
    <section className="rounded-xl bg-surface shadow-card">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-fg-muted">{hint}</p>}
        </div>
        {extra}
      </div>
      <div className="flex flex-col gap-4 px-5 py-5">{children}</div>
      <div className="flex justify-end border-t border-border px-5 py-3">
        <Button variant="primary" onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}
