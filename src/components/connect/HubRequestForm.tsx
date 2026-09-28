"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

export type HubOption = { id: string; name: string; steps: { id: string; title: string; relevant: boolean }[] };
type Result = { ok: true } | { ok: false; message: string };

const select = "mt-2 w-full rounded-xs border border-line bg-field px-3 py-3 text-body text-bone";

/**
 * "Ask for help with this hub (and this plan step)": shared by partner intros
 * and mentor requests. Steps whose needs match are listed first, marked ●.
 */
export function HubRequestForm({
  hubs,
  initialHubId,
  initialStepId,
  noteLabel,
  placeholder,
  hint,
  submitLabel,
  sentLine,
  send,
}: {
  hubs: HubOption[];
  initialHubId: string | null;
  initialStepId: string | null;
  noteLabel: string;
  placeholder: string;
  hint: string;
  submitLabel: string;
  sentLine: string;
  send: (input: { hubId: string; planStepId: string | null; note: string }) => Promise<Result>;
}) {
  const [hubId, setHubId] = useState(initialHubId ?? hubs[0]?.id ?? "");
  const [stepId, setStepId] = useState<string | null>(initialStepId);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, start] = useTransition();
  const steps = [...(hubs.find((h) => h.id === hubId)?.steps ?? [])].sort((a, b) => Number(b.relevant) - Number(a.relevant));

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <Label tone="signal" live>
          Request sent
        </Label>
        <p className="type-display text-headline">{sentLine}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <label className="block">
        <Label>For which hub</Label>
        <select
          className={select}
          value={hubId}
          onChange={(e) => {
            setHubId(e.target.value);
            setStepId(null);
          }}
        >
          {hubs.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </label>
      {steps.length > 0 && (
        <label className="block">
          <Label>For which game-plan step · Optional</Label>
          <select className={select} value={stepId ?? ""} onChange={(e) => setStepId(e.target.value || null)}>
            <option value="">No specific step</option>
            {steps.map((s) => (
              <option key={s.id} value={s.id}>
                {s.relevant ? "● " : ""}
                {s.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <TextArea scale="title" label={noteLabel} placeholder={placeholder} value={note} onChange={(e) => setNote(e.target.value)} hint={hint} />
      {msg && <p className="label text-signal">{msg}</p>}
      <div>
        <Button
          disabled={busy}
          onClick={() =>
            start(async () => {
              const res = await send({ hubId, planStepId: stepId, note });
              if (res.ok) setSent(true);
              else setMsg(res.message);
            })
          }
        >
          {busy ? "Sending" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
