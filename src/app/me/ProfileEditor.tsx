"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/ArrowLink";
import { Chips } from "@/components/ui/Chips";
import { TextArea, TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { FOCUS_AREAS, ROLE_CHOICES, type ProfileInput } from "@/lib/profile-schema";
import { ROLE_LABEL } from "@/lib/roles";
import { updateProfile } from "./actions";

type V = {
  [K in keyof ProfileInput]-?: ProfileInput[K] extends string | null | undefined ? string : NonNullable<ProfileInput[K]>;
};

function Group({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 md:grid-cols-[18rem_1fr]">
      <div>
        <Label>{n}</Label>
        <h2 className="type-display mt-2 text-title">{title}</h2>
      </div>
      <div className="flex max-w-3xl flex-col gap-8">{children}</div>
    </section>
  );
}

const REFLECT: { key: keyof V; label: string }[] = [
  { key: "beliefs", label: "What you believe that most people don't" },
  { key: "workStyle", label: "How you work when it's going well" },
  { key: "buildingToward", label: "What you're building toward" },
  { key: "strengths", label: "Where you're strongest" },
  { key: "gaps", label: "Where you need other people" },
  { key: "decisionStyle", label: "How you make hard calls" },
];

export function ProfileEditor({ initial }: { initial: V }) {
  const [v, setV] = useState<V>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();
  const set = <K extends keyof V>(k: K, val: V[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setStatus("idle");
  };
  const text = (k: keyof V) => ({
    value: v[k] as string,
    onChange: (e: { target: { value: string } }) => set(k, e.target.value as never),
    error: errors[k],
  });
  const has = (r: (typeof ROLE_CHOICES)[number]) => v.roles.includes(r);

  function save() {
    start(async () => {
      const res = await updateProfile(v);
      if (res.ok) {
        setErrors({});
        setStatus("saved");
      } else {
        setErrors(res.errors);
        setStatus("error");
      }
    });
  }

  return (
    <div className="pb-32">
      <Group n="01" title="About">
        <TextInput scale="title" label="Name" {...text("name")} />
        <TextInput label="One line about you" {...text("headline")} />
        <TextInput label="Where you're based" {...text("location")} />
      </Group>

      <Group n="02" title="Roles">
        <Chips options={ROLE_CHOICES} value={v.roles} onChange={(x) => set("roles", x)} render={(r) => ROLE_LABEL[r]} />
        {errors.roles && <span className="label text-signal">{errors.roles}</span>}
      </Group>

      {has("BUILDER") && (
        <Group n="03" title="How you think">
          {REFLECT.map((r) => (
            <TextArea key={r.key} label={r.label} {...text(r.key)} />
          ))}
        </Group>
      )}

      {(has("MENTOR") || has("BACKER")) && (
        <Group n="04" title="Focus">
          <Chips options={FOCUS_AREAS} value={v.focusAreas} onChange={(x) => set("focusAreas", x)} max={8} />
          {has("MENTOR") && <TextArea label="What you can help with" {...text("mentorNote")} />}
          {has("BACKER") && (
            <TextArea label="What you back · No amounts, introductions only" {...text("backerNote")} />
          )}
        </Group>
      )}

      {has("PARTNER") && (
        <Group n="05" title="Your firm">
          <TextInput label="Firm or studio name" {...text("partnerOrgName")} />
        </Group>
      )}

      <Group n="06" title="Contact">
        <p className="text-body text-smoke">Only shown to someone after you both say yes.</p>
        <TextInput type="email" label="Email for introductions" {...text("contactEmail")} />
        <TextInput type="url" label="A link" placeholder="https://" {...text("contactLink")} />
      </Group>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-field">
        <div className="flex items-center justify-between gap-6 px-edge py-3">
          <Label tone={status === "error" ? "signal" : status === "saved" ? "bone" : "smoke"}>
            {status === "saved" ? "Saved" : status === "error" ? "Check the fields marked above" : "Edit anything, then save"}
          </Label>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
