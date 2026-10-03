"use client";

import { useActionState } from "react";
import { signalAction, type SignalState } from "./actions";

// Save / Not for me, with a visible confirmation once Self has it.
export function SignalButtons({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<SignalState, FormData>(signalAction, {});
  return (
    <form action={action} className="mt-3 flex items-center gap-3 text-xs">
      <input type="hidden" name="productId" value={productId} />
      <button name="type" value="saved" disabled={pending} className="underline-offset-4 hover:underline disabled:opacity-50">
        Save
      </button>
      <button name="type" value="rejected" disabled={pending} className="text-[#8a8576] underline-offset-4 hover:underline disabled:opacity-50">
        Not for me
      </button>
      <span className={state.error ? "text-[#b42318]" : "text-[#5b7a4a]"} aria-live="polite">
        {pending ? "Sending…" : state.error ?? (state.sent === "saved" ? "✓ Saved, your Self knows" : state.sent === "rejected" ? "✓ Got it, your Self knows" : "")}
      </span>
    </form>
  );
}
