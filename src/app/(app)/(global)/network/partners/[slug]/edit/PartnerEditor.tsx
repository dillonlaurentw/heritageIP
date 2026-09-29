"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePartnerProfile } from "@/app/actions/network";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";

type P = { id: string; slug: string; tagline: string; description: string; services: string[]; location: string; priceNote: string; website: string; contactEmail: string };

export function PartnerEditor({ partner }: { partner: P }) {
  const router = useRouter();
  const [f, setF] = useState({ ...partner, services: partner.services.join("\n") });
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await updatePartnerProfile(partner.id, {
            tagline: f.tagline,
            description: f.description,
            services: f.services.split("\n").map((s) => s.trim()).filter(Boolean),
            location: f.location,
            priceNote: f.priceNote,
            website: f.website,
            contactEmail: f.contactEmail,
          });
          if (!res.ok) return setError(res.message);
          router.push(`/network/partners/${partner.slug}` as Route);
        });
      }}
    >
      <Field label="Tagline">
        <Input value={f.tagline} onChange={set("tagline")} />
      </Field>
      <Field label="What you do">
        <Textarea rows={5} value={f.description} onChange={set("description")} />
      </Field>
      <Field label="Services" hint="One per line.">
        <Textarea rows={4} value={f.services} onChange={set("services")} />
      </Field>
      <Field label="Location">
        <Input value={f.location} onChange={set("location")} />
      </Field>
      <Field label="Pricing note" hint="Your services only, e.g. “Formation from €900”.">
        <Input value={f.priceNote} onChange={set("priceNote")} />
      </Field>
      <Field label="Website">
        <Input value={f.website} onChange={set("website")} placeholder="https://" />
      </Field>
      <Field label="Intro address" hint="Private. Shared only with builders whose intro you accept.">
        <Input type="email" value={f.contactEmail} onChange={set("contactEmail")} />
      </Field>
      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div>
        <Button type="submit" variant="primary" size="md" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
