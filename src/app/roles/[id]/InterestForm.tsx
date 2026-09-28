"use client";

import { useState, useTransition } from "react";
import { signalInterest } from "@/app/actions/signals";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";

export function InterestForm({ roleId, ownerFirstName }: { roleId: string; ownerFirstName: string }) {
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-col gap-6">
      <TextArea
        scale="title"
        label={`A note to ${ownerFirstName}`}
        placeholder="Why this, why you, and what you'd bring in the first three months."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        hint="They'll see this with your profile headline and strengths. Your contact details stay hidden until they say yes."
      />
      {msg && <p className="label text-signal">{msg}</p>}
      <div>
        <Button
          disabled={busy}
          onClick={() =>
            start(async () => {
              const res = await signalInterest(roleId, note);
              if (!res.ok) setMsg(res.message);
            })
          }
        >
          {busy ? "Sending" : "Signal interest"}
        </Button>
      </div>
    </div>
  );
}
