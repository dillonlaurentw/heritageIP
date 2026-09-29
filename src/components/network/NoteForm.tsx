"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Input";

/** A single note + send button: role interest, backer interest. */
export function NoteForm({
  send,
  cta,
  label,
  placeholder,
  sentText,
}: {
  send: (note: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  cta: string;
  label: string;
  placeholder: string;
  sentText: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, start] = useTransition();
  if (sent) return <p className="rounded-lg bg-bg-subtle px-4 py-3 text-sm">{sentText}</p>;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await send(note);
          if (!res.ok) return setError(res.message);
          setSent(true);
          router.refresh();
        });
      }}
    >
      <Field label={label}>
        <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} required />
      </Field>
      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div>
        <Button type="submit" variant="primary" size="md" disabled={busy || note.trim().length < 10}>
          {busy ? "Sending…" : cta}
        </Button>
      </div>
    </form>
  );
}
