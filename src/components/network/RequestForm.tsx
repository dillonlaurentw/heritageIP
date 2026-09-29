"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Input";

export type WorkspaceOption = { id: string; slug: string; name: string; steps: { id: string; title: string; needs: string[] }[] };
type Send = (input: { workspaceId: string; targetId: string; stepId: string | null; note: string }) => Promise<{ ok: true } | { ok: false; message: string }>;

/**
 * "Which company, which step, a note": the one form for partner intros and
 * mentor requests. The step ties the request to the game plan, so the answer
 * shows up on that step.
 */
export function RequestForm({
  options,
  targetId,
  send,
  cta,
  placeholder,
  defaultWs,
  defaultStep,
  preferNeed,
}: {
  options: WorkspaceOption[];
  targetId: string;
  send: Send;
  cta: string;
  placeholder: string;
  defaultWs?: string;
  defaultStep?: string;
  preferNeed?: string;
}) {
  const router = useRouter();
  const first = options.find((o) => o.slug === defaultWs) ?? options[0];
  const [ws, setWs] = useState(first?.id ?? "");
  const current = options.find((o) => o.id === ws);
  const initialStep = defaultStep && first?.steps.some((s) => s.id === defaultStep) ? defaultStep : (first?.steps.find((s) => preferNeed && s.needs.includes(preferNeed))?.id ?? "");
  const [step, setStep] = useState(initialStep);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, start] = useTransition();

  if (!options.length) return <p className="text-sm text-fg-muted">Start a company workspace first; requests are sent on behalf of a company.</p>;
  if (sent) return <p className="rounded-lg bg-bg-subtle px-4 py-3 text-sm">Sent. You&apos;ll hear back in Connections and by email.</p>;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await send({ workspaceId: ws, targetId, stepId: step || null, note });
          if (!res.ok) return setError(res.message);
          setSent(true);
          router.refresh();
        });
      }}
    >
      {options.length > 1 && (
        <Field label="For">
          <Select
            value={ws}
            onChange={(e) => {
              setWs(e.target.value);
              setStep("");
            }}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {current && current.steps.length > 0 && (
        <Field label="For which game-plan step?" hint="Optional. The answer will show up on that step.">
          <Select value={step} onChange={(e) => setStep(e.target.value)}>
            <option value="">No particular step</option>
            {current.steps.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Your note">
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
