"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState, useTransition } from "react";
import { addSuggestedStep, newConversation, sendMessage, type ChatMessage } from "../actions";
import { AgentStrip, type AgentState } from "@/components/agents/AgentStrip";
import { Button } from "@/components/ui/ArrowLink";
import { TextArea } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { duration, ease } from "@/design/motion";
import { HUB_AGENT_COPY, type HubAgentKey } from "@/lib/hub-agents";
import { NEEDS, type Need } from "@/lib/needs";
import { STAGE_COPY, type Stage } from "@/lib/plan-order";

export function AgentChat({
  hub,
  agent,
  initial,
  isOwner,
  live,
  firstName,
  autoSend,
}: {
  hub: { id: string; slug: string; name: string };
  agent: HubAgentKey;
  initial: ChatMessage[];
  isOwner: boolean;
  live: boolean;
  firstName: string;
  autoSend: string | null;
}) {
  const copy = HUB_AGENT_COPY[agent];
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<AgentState>("idle");
  const [demo, setDemo] = useState(!live);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const sentAuto = useRef(false);

  function send(text: string) {
    if (!text.trim() || busy) return;
    setError(null);
    setState("thinking");
    setDraft("");
    // Show the question straight away while the agent thinks.
    setMessages((m) => [...m, { id: "pending", role: "USER", text, suggestedStep: null, addedStepId: null }]);
    start(async () => {
      const res = await sendMessage(hub.id, agent, text);
      setMessages((m) => m.filter((x) => x.id !== "pending"));
      if (res.ok) {
        setMessages((m) => [...m, ...res.messages]);
        setDemo(res.demo);
        setState("done");
      } else {
        setDraft(text);
        setError(res.message);
        setState("error");
      }
    });
  }

  // Arriving from "Ask SELF anything" sends the question once.
  useEffect(() => {
    if (autoSend && !sentAuto.current) {
      sentAuto.current = true;
      // Drop ?q= so a refresh doesn't ask again.
      window.history.replaceState(null, "", window.location.pathname);
      send(autoSend);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages.length, reduce]);

  return (
    <div className="flex flex-col gap-6">
      <AgentStrip agent={copy.role} state={state} demo={demo} right={hub.name} />

      {agent === "legal" && (
        <div className="flex flex-wrap items-center justify-between gap-4 border border-signal px-4 py-3">
          <Label tone="signal">Not legal advice · An explainer, not a lawyer</Label>
          <Link href={`/hubs/${hub.slug}/connect/legal` as Route} className="text-small font-semibold text-signal">
            Talk to a legal partner →
          </Link>
        </div>
      )}

      <ol className="flex flex-col divide-y divide-line border-y border-line" aria-live="polite">
        {messages.length === 0 && (
          <li className="flex flex-col gap-4 py-8">
            <p className="type-display max-w-[24ch] text-headline">What do you want to work on?</p>
            <div className="flex flex-wrap gap-2">
              {copy.starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-xs border border-line px-3 py-2 text-left text-small font-medium hover:border-bone"
                >
                  {s}
                </button>
              ))}
            </div>
          </li>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.li
              key={m.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.base, ease: ease.outStrong }}
              className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[10rem_1fr] sm:gap-6"
            >
              <Label className="self-start pt-1.5" tone={m.role === "AGENT" ? "signal" : "bone"}>
                {m.role === "AGENT" ? copy.name : firstName}
              </Label>
              <div className="flex flex-col gap-4">
                <p className={`measure whitespace-pre-line ${m.role === "AGENT" ? "text-lead" : "text-lead text-smoke"}`}>{m.text}</p>
                {m.suggestedStep && <SuggestedStep message={m} hubSlug={hub.slug} canAdd={isOwner} />}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        {state === "thinking" && (
          <li className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[10rem_1fr] sm:gap-6">
            <Label tone="signal" live>
              {copy.name}
            </Label>
            <p className="text-lead text-smoke">Thinking…</p>
          </li>
        )}
      </ol>
      <div ref={bottom} />

      <div className="flex flex-col gap-4">
        <TextArea
          scale="title"
          placeholder={`Ask the ${copy.role.toLowerCase()}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(draft);
          }}
          rows={2}
        />
        <div className="flex flex-wrap items-center gap-6">
          <Button onClick={() => send(draft)} disabled={busy || !draft.trim()}>
            {busy ? "Thinking" : "Send"}
          </Button>
          <span className="label hidden text-smoke md:inline">⌘ + Enter</span>
          {messages.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                start(async () => {
                  await newConversation(hub.id, agent);
                  setMessages([]);
                  setState("idle");
                })
              }
              className="text-small font-medium text-smoke hover:text-bone"
            >
              New conversation
            </button>
          )}
          {error && <span className="label text-signal">{error}</span>}
        </div>
      </div>
    </div>
  );
}

function SuggestedStep({ message, hubSlug, canAdd }: { message: ChatMessage; hubSlug: string; canAdd: boolean }) {
  const s = message.suggestedStep!;
  const [added, setAdded] = useState(Boolean(message.addedStepId));
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-col gap-3 border-l-2 border-signal pl-4">
      <Label tone="signal">Suggested step · {STAGE_COPY[s.stage as Stage]?.label ?? s.stage}</Label>
      <p className="text-body font-semibold">{s.title}</p>
      <p className="text-small text-smoke">{s.detail}</p>
      {s.needs.length > 0 && <Label>Needs · {s.needs.map((n) => NEEDS[n as Need]?.label ?? n).join(", ")}</Label>}
      {added ? (
        <Link href={`/hubs/${hubSlug}/plan` as Route} className="label text-bone">
          Added to the game plan →
        </Link>
      ) : canAdd ? (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            start(async () => {
              const res = await addSuggestedStep(message.id);
              if (res.ok) setAdded(true);
              else setMsg(res.message);
            })
          }
          className="self-start text-small font-semibold text-signal hover:underline"
        >
          Add to the game plan →
        </button>
      ) : (
        <Label>Only the founder can add steps</Label>
      )}
      {msg && <span className="label text-signal">{msg}</span>}
    </div>
  );
}
