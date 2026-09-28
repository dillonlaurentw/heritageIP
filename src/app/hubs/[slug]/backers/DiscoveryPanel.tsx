"use client";

import { useState, useTransition } from "react";
import { setDiscovery } from "./actions";
import { Button } from "@/components/ui/ArrowLink";
import { Chips } from "@/components/ui/Chips";
import { TextInput } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { FOCUS_AREAS } from "@/lib/profile-schema";

type Sector = (typeof FOCUS_AREAS)[number];

export function DiscoveryPanel({
  hubId,
  initial,
}: {
  hubId: string;
  initial: { discoverable: boolean; sector: Sector | null; backerAsk: string };
}) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial.discoverable);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function save(discoverable: boolean) {
    setMsg(null);
    start(async () => {
      const res = await setDiscovery(hubId, { ...v, discoverable });
      if (res.ok) {
        setV({ ...v, discoverable });
        setSaved(discoverable);
        setMsg(discoverable ? "Open to backers." : "Hidden from backers.");
      } else setMsg(res.message);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <Label tone={saved ? "signal" : "smoke"} live={saved}>
          {saved ? "Open to backer discovery" : "Not discoverable"}
        </Label>
      </div>
      <div>
        <Label>Sector</Label>
        <div className="mt-3">
          <Chips
            options={FOCUS_AREAS}
            value={v.sector ? [v.sector] : []}
            onChange={(x) => setV({ ...v, sector: x.find((s) => s !== v.sector) ?? null })}
          />
        </div>
      </div>
      <TextInput
        label="What you'd want from a backer · Optional"
        placeholder="Operators who know EU food retail, and intros to grant funds"
        hint="Help, experience, intros. No amounts, valuations or terms: SELF is introductions only."
        value={v.backerAsk}
        onChange={(e) => setV({ ...v, backerAsk: e.target.value })}
      />
      {msg && <p className={`label ${msg.startsWith("Open") || msg.startsWith("Hidden") ? "text-bone" : "text-signal"}`}>{msg}</p>}
      <div className="flex flex-wrap items-center gap-4">
        {saved ? (
          <>
            <Button onClick={() => save(true)} disabled={busy}>
              {busy ? "Saving" : "Save changes"}
            </Button>
            <button type="button" onClick={() => save(false)} disabled={busy} className="text-body font-medium text-smoke hover:text-bone">
              Stop being discoverable
            </button>
          </>
        ) : (
          <Button onClick={() => save(true)} disabled={busy}>
            {busy ? "Saving" : "Open to backers"}
          </Button>
        )}
      </div>
    </div>
  );
}
