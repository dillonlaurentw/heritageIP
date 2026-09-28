"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePartner } from "../../actions";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea, TextInput } from "@/components/ui/Field";

type Fields = {
  tagline: string;
  description: string;
  services: string;
  location: string;
  priceNote: string;
  website: string;
  contactEmail: string;
};

export function PartnerEditor({ partnerId, slug, initial }: { partnerId: string; slug: string; initial: Fields }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const f = (k: keyof Fields) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }) });

  return (
    <div className="flex max-w-3xl flex-col gap-8 pb-32">
      <TextInput scale="title" label="One line" {...f("tagline")} />
      <TextArea label="What you do, for whom" {...f("description")} />
      <TextArea label="Services · One per line" {...f("services")} />
      <TextInput label="Where you're based" {...f("location")} />
      <TextInput label="Pricing · Optional" placeholder="Fixed-fee formation from €900" {...f("priceNote")} />
      <TextInput type="url" label="Website · Optional" placeholder="https://" {...f("website")} />
      <TextInput
        type="email"
        label="Intro email"
        hint="Builders get this only after you accept their intro."
        {...f("contactEmail")}
      />
      {msg && <p className="label text-signal">{msg}</p>}
      <div>
        <Button
          disabled={busy}
          onClick={() =>
            start(async () => {
              const res = await updatePartner(partnerId, {
                ...v,
                services: v.services.split("\n").map((s) => s.trim()).filter(Boolean),
              });
              if (res.ok) router.push(`/partners/${slug}`);
              else setMsg(res.message);
            })
          }
        >
          {busy ? "Saving" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
