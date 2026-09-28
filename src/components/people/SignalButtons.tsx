"use client";

import { useState, useTransition } from "react";
import { respondToSignal } from "@/app/actions/signals";
import { Button } from "@/components/ui/ArrowLink";

/** Accept / decline (recipient) or withdraw (sender) on a pending signal. */
export function SignalButtons({ signalId, mode, acceptLabel = "Accept" }: { signalId: string; mode: "respond" | "withdraw"; acceptLabel?: string }) {
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const act = (action: "accept" | "decline" | "withdraw") =>
    start(async () => {
      const res = await respondToSignal(signalId, action);
      if (!res.ok) setMsg(res.message);
    });

  return (
    <div className="flex flex-wrap items-center gap-4">
      {mode === "respond" ? (
        <>
          <Button onClick={() => act("accept")} disabled={busy}>
            {busy ? "Saving" : acceptLabel}
          </Button>
          <button type="button" onClick={() => act("decline")} disabled={busy} className="text-body font-medium text-smoke hover:text-bone">
            Decline
          </button>
        </>
      ) : (
        <button type="button" onClick={() => act("withdraw")} disabled={busy} className="text-small font-medium text-smoke hover:text-bone">
          Withdraw
        </button>
      )}
      {msg && <span className="label text-signal">{msg}</span>}
    </div>
  );
}
