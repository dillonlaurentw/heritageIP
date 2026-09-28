"use client";

import { useState, useTransition } from "react";
import { signalBackerInterest } from "@/app/hubs/[slug]/backers/actions";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";

export function BackerInterestForm({ hubId, founderFirstName }: { hubId: string; founderFirstName: string }) {
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-col gap-6">
      <TextArea
        scale="title"
        label={`A note to ${founderFirstName}`}
        placeholder="Why this hub, and what you'd bring beyond money."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        hint="No amounts or terms. This is interest only; if they say yes, you'll both get each other's details."
      />
      {msg && <p className="label text-signal">{msg}</p>}
      <div>
        <Button
          disabled={busy}
          onClick={() =>
            start(async () => {
              const res = await signalBackerInterest(hubId, note);
              if (!res.ok) setMsg(res.message);
            })
          }
        >
          {busy ? "Sending" : "I'm interested"}
        </Button>
      </div>
    </div>
  );
}
