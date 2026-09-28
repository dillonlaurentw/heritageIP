"use client";

import { useState, useTransition } from "react";
import { askForIntro } from "../actions";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

type HubOption = { id: string; name: string; steps: { id: string; title: string; relevant: boolean }[] };

const select = "mt-2 w-full rounded-xs border border-line bg-field px-3 py-3 text-body text-bone";

export function IntroForm({
  partnerId,
  partnerName,
  hubs,
  initialHubId,
  initialStepId,
}: {
  partnerId: string;
  partnerName: string;
  hubs: HubOption[];
  initialHubId: string | null;
  initialStepId: string | null;
}) {
  const [hubId, setHubId] = useState(initialHubId ?? hubs[0]?.id ?? "");
  const [stepId, setStepId] = useState<string | null>(initialStepId);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, start] = useTransition();
  const hub = hubs.find((h) => h.id === hubId);
  const steps = [...(hub?.steps ?? [])].sort((a, b) => Number(b.relevant) - Number(a.relevant));

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <Label tone="signal" live>
          Intro requested
        </Label>
        <p className="type-display text-headline">Sent. We&apos;ll email you when {partnerName} says yes.</p>
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
      <TextArea
        scale="title"
        label={`A note to ${partnerName}`}
        placeholder="What you need, by when, and what you've done so far."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        hint="They'll see this with your hub's name and one-liner. Your contact details are shared only if they accept."
      />
      {msg && <p className="label text-signal">{msg}</p>}
      <div>
        <Button
          disabled={busy}
          onClick={() =>
            start(async () => {
              const res = await askForIntro({ partnerId, hubId, planStepId: stepId, note });
              if (res.ok) setSent(true);
              else setMsg(res.message);
            })
          }
        >
          {busy ? "Sending" : "Request an intro"}
        </Button>
      </div>
    </div>
  );
}
