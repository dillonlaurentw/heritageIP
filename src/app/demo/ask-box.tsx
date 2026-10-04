"use client";

import { useActionState, useRef } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { askAction, type AskState } from "./actions";

const EXAMPLES = [
  "Should we email or text them about a sale?",
  "How should we describe the waxed canvas jacket to them?",
  "What should a support agent know before replying to them?",
];

// Try a question the way a company's workflow or AI agent would ask it.
export function AskBox() {
  const [state, action, pending] = useActionState<AskState, FormData>(askAction, {});
  const input = useRef<HTMLTextAreaElement>(null);
  return (
    <form action={action} className="mt-3 space-y-3">
      <textarea
        ref={input}
        name="question"
        rows={2}
        maxLength={1000}
        placeholder="Ask Self something about this customer…"
        className="w-full rounded-md border border-[#e6e0d4] bg-[#fff] p-3 text-sm outline-none focus:border-[#8a8576]"
      />
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => input.current && (input.current.value = q)}
            className="rounded-full border border-[#e6e0d4] px-3 py-1 text-xs text-[#5c5849] hover:border-[#8a8576]"
          >
            {q}
          </button>
        ))}
      </div>
      {pending ? (
        // Self's "deciding" orb (the solving thinking orb), as in SELF itself.
        <span className="inline-flex items-center gap-3 rounded-full bg-[#efeadf] py-2 pr-5 pl-3 text-sm text-[#5c5849]">
          <ThinkingOrb state="solving" size={20} theme="light" aria-hidden />
          Self is thinking it through
        </span>
      ) : (
        <button className="rounded-full bg-[#111] px-5 py-2 text-sm text-[#fff]">Ask Self</button>
      )}
      {state.error && <p className="text-sm text-[#b42318]">{state.error}</p>}
      {state.result && (
        <div className="rounded-md border border-[#e6e0d4] bg-[#fff] p-4 text-sm">
          <p className="text-xs text-[#8a8576]">Cadence asked: “{state.question}”</p>
          <p className="mt-2">{state.result.answer}</p>
          <p className="mt-2 text-xs text-[#8a8576]">
            {state.result.declined ? "Self declined this question." : `Confidence: ${state.result.confidence}`}
          </p>
        </div>
      )}
    </form>
  );
}
