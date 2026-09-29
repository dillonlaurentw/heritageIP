"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setSimOptIn } from "@/app/actions/agent";
import { Switch } from "@/components/ui/Switch";

/** Opt your Self in or out of rehearsals. Off stops any rehearsal you're in. */
export function OptInSwitch({ on, label }: { on: boolean; label?: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const toggle = (
    <Switch
      label={label ?? "Let my Self join rehearsals"}
      checked={on}
      disabled={busy}
      onCheckedChange={(v) =>
        start(async () => {
          await setSimOptIn(v);
          router.refresh();
        })
      }
    />
  );
  if (label)
    return (
      <label className="flex items-center justify-between gap-3">
        <span className="text-base font-medium">{label}</span>
        {toggle}
      </label>
    );
  return (
    <label className="flex items-center gap-3 rounded-xl bg-surface shadow-card p-4">
      {toggle}
      <span>
        <span className="block text-base font-medium">{on ? "Your Self can join rehearsals" : "Your Self stays out of rehearsals"}</span>
        <span className="block text-sm text-fg-muted">{on ? "Turn off any time; running rehearsals with you stop." : "Nobody can include you until you turn this on."}</span>
      </span>
    </label>
  );
}
