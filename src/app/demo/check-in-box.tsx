"use client";

import { useActionState, useEffect, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import type { ConfirmStatus } from "@/lib/demo/self-client";
import { checkInAction, checkInStatusAction, type CheckInState } from "./actions";

// At the counter: staff enter the number or email someone gives. Their Self
// asks them on their phone; the shop learns who it is only if they confirm.
export function CheckInBox() {
  const [state, action, pending] = useActionState<CheckInState, FormData>(checkInAction, {});
  const [result, setResult] = useState<ConfirmStatus | null>(null);

  useEffect(() => {
    if (!state.id) return;
    const id = state.id;
    let stopped = false;
    const started = Date.now();
    const poll = async () => {
      if (stopped) return;
      const status = await checkInStatusAction(id).catch(() => null);
      if (stopped) return;
      setResult(status);
      if (status?.status === "pending" && Date.now() - started < 130_000) setTimeout(poll, 2000);
    };
    const first = setTimeout(poll, 1500);
    return () => {
      stopped = true;
      clearTimeout(first);
    };
  }, [state.id]);

  const waiting = Boolean(state.id) && (!result || result.status === "pending");
  return (
    <div className="mt-3 space-y-3">
      <form action={action} className="flex flex-wrap gap-2" onSubmit={() => setResult(null)}>
        <input
          name="contact"
          placeholder="Their phone number or email"
          className="min-w-56 flex-1 rounded-md border border-[#e6e0d4] bg-[#fff] p-3 text-sm outline-none focus:border-[#8a8576]"
        />
        <button disabled={pending || waiting} className="rounded-full bg-[#111] px-5 py-2 text-sm text-[#fff] disabled:opacity-50">
          Check in with Self ID
        </button>
      </form>
      {state.error && <p className="text-sm text-[#b42318]">{state.error}</p>}
      {waiting && (
        <span className="inline-flex items-center gap-3 rounded-full bg-[#efeadf] py-2 pr-5 pl-3 text-sm text-[#5c5849]">
          <ThinkingOrb state="working" size={20} theme="light" aria-hidden />
          Waiting for them to confirm on their Self…
        </span>
      )}
      {result?.status === "approved" && (
        <div className="rounded-md border border-[#e6e0d4] bg-[#fff] p-4 text-sm">
          <p className="font-medium">Confirmed: {[result.given_name, result.family_name].filter(Boolean).join(" ") || "a Self member"} is here.</p>
          <p className="mt-1 text-xs text-[#8a8576]">Their id at Cadence: {result.sub.slice(0, 12)}…</p>
          {result.claims.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {result.claims.map((c) => (
                <li key={c.code}>
                  {c.title} · <span className="font-mono">{c.redeem_code ?? c.code}</span>
                  {c.redeemed ? " (used)" : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-[#8a8576]">No Access claimed here yet.</p>
          )}
        </div>
      )}
      {result?.status === "denied" && <p className="text-sm text-[#8a8576]">They said it isn’t them. Nothing was shared.</p>}
      {result?.status === "expired" && <p className="text-sm text-[#8a8576]">No answer in time. Nothing was shared.</p>}
    </div>
  );
}
