"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { proposePersona, savePersona, setSimOptIn } from "@/app/actions/agent";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

/** Edit the persona directly, or ask SELF for a rebuilt one (a proposal: nothing saves until you do). */
export function PersonaEditor({ initial, isDefault, live }: { initial: string; isDefault: boolean; live: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState(initial);
  const [proposal, setProposal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const dirty = text.trim() !== initial.trim();

  const save = (value: string) =>
    start(async () => {
      const res = await savePersona(value);
      if (!res.ok) return setError(res.message);
      setText(value);
      setProposal(null);
      toast("Saved");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      {isDefault && !dirty && <p className="text-xs text-fg-subtle">This is a plain restatement of your profile answers. Edit it, or ask SELF to rewrite it.</p>}
      <Textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} className="text-base leading-relaxed" />
      {proposal && (
        <div className="flex flex-col gap-2 rounded-lg border border-accent/40 p-4">
          <p className="text-xs font-medium text-fg-subtle">SELF&apos;s suggestion{live ? "" : " (demo agent)"}. Nothing changes until you use it.</p>
          <p className="text-base leading-relaxed whitespace-pre-line">{proposal}</p>
          <div className="flex gap-2">
            <Button variant="primary" disabled={busy} onClick={() => save(proposal)}>
              Use this
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setProposal(null)}>
              Discard
            </Button>
          </div>
        </div>
      )}
      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={busy || !dirty} onClick={() => save(text)}>
          Save
        </Button>
        <Button
          disabled={busy}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await proposePersona();
              if (!res.ok) return setError(res.message);
              setProposal(res.output.persona);
            })
          }
        >
          <Sparkles className="size-3.5" /> {busy ? "Thinking…" : "Rebuild from my answers"}
        </Button>
      </div>
    </div>
  );
}

export function OptInSwitch({ on }: { on: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <label className="flex items-center gap-3 rounded-lg border border-border p-4">
      <Switch
        label="Let my agent join simulations"
        checked={on}
        disabled={busy}
        onCheckedChange={(v) =>
          start(async () => {
            await setSimOptIn(v);
            router.refresh();
          })
        }
      />
      <span>
        <span className="block text-base font-medium">{on ? "Your agent can join simulations" : "Your agent stays out of simulations"}</span>
        <span className="block text-sm text-fg-muted">{on ? "Turn off any time; running simulations with you stop." : "Nobody can include you until you turn this on."}</span>
      </span>
    </label>
  );
}
