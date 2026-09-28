"use client";

import { useState, useTransition } from "react";
import { proposePersona, savePersona, setSimOptIn } from "./actions";
import { AgentStrip } from "@/components/agents/AgentStrip";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";

export function PersonaEditor({ initial, isDefault, live }: { initial: string; isDefault: boolean; live: boolean }) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [proposal, setProposal] = useState<{ text: string; demo: boolean } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [thinking, setThinking] = useState(false);

  const save = (value: string) =>
    start(async () => {
      const res = await savePersona(value);
      if (res.ok) {
        setSaved(value);
        setText(value);
        setMsg("Saved. Your agent uses this from its next simulation.");
      } else setMsg(res.message);
    });

  return (
    <div className="flex flex-col gap-6">
      {isDefault && saved === initial && (
        <Label>Built automatically from your answers · Edit it, or ask SELF for a sharper version</Label>
      )}
      <TextArea scale="title" value={text} onChange={(e) => setText(e.target.value)} rows={6} />
      <div className="flex flex-wrap items-center gap-4">
        {text.trim() !== saved.trim() && (
          <Button onClick={() => save(text)} disabled={busy}>
            Save
          </Button>
        )}
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => {
            setThinking(true);
            setMsg(null);
            start(async () => {
              const res = await proposePersona();
              setThinking(false);
              if (res.ok) setProposal({ text: res.output.persona, demo: res.demo });
              else setMsg(res.message);
            });
          }}
        >
          {thinking ? "Thinking" : "Rebuild from my answers"}
        </Button>
        {msg && <span className="label text-bone">{msg}</span>}
      </div>
      {thinking && <AgentStrip agent="Persona agent" state="thinking" demo={!live} />}
      {proposal && (
        <div className="flex flex-col gap-5 border border-signal p-5">
          <AgentStrip agent="Persona agent · Proposal" state="done" demo={proposal.demo} />
          <p className="text-lead">{proposal.text}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={() => {
                save(proposal.text);
                setProposal(null);
              }}
              disabled={busy}
            >
              Use this
            </Button>
            <button type="button" className="text-body font-medium text-smoke hover:text-bone" onClick={() => { setText(proposal.text); setProposal(null); }}>
              Edit it first
            </button>
            <button type="button" className="text-body font-medium text-smoke hover:text-bone" onClick={() => setProposal(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OptInSwitch({ on }: { on: boolean }) {
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <Label tone={on ? "signal" : "smoke"} live={on}>
        {on ? "On · Your agent can join simulations" : "Off · Your agent can't join simulations"}
      </Label>
      <div>
        <Button variant={on ? "ghost" : "signal"} disabled={busy} onClick={() => start(() => setSimOptIn(!on))}>
          {on ? "Turn off simulations" : "Let my agent join simulations"}
        </Button>
      </div>
    </div>
  );
}
