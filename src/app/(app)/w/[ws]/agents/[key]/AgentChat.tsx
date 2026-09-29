"use client";

import { ArrowUp, Check, ListPlus, Plus, RotateCcw, Scale, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addAgentStep, addAgentTasks, newAgentConversation, sendAgentMessage } from "@/app/actions/ai";
import type { AgentChatOutput } from "@/agents/prompts/workspaceAgents";
import { Markdown } from "@/components/ai/Markdown";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { NEEDS } from "@/lib/needs";
import { STAGES } from "@/lib/system-dbs";
import { AGENT_COPY, type WorkspaceAgentKey } from "@/lib/workspace-agents";

export type ChatMessage = { id: string; role: "USER" | "AGENT"; text: string; data: AgentChatOutput | null };

export function AgentChat({
  workspace,
  agent,
  initial,
  live,
  canChat,
  question,
}: {
  workspace: { id: string; slug: string };
  agent: WorkspaceAgentKey;
  initial: ChatMessage[];
  live: boolean;
  canChat: boolean;
  question?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(!live);
  const [used, setUsed] = useState<Record<string, true>>({});
  const [busy, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setError(null);
    setPending(t);
    setDraft("");
    start(async () => {
      const res = await sendAgentMessage(workspace.id, agent, t);
      setPending(null);
      if (!res.ok) {
        setError(res.message);
        setDraft(t);
        return;
      }
      setDemo(res.demo);
      setMessages((m) => [...m, res.user, res.reply]);
    });
  };

  // A question handed over from "Ask SELF anything" is sent once.
  useEffect(() => {
    if (question && canChat && !asked.current) {
      asked.current = true;
      router.replace(`/w/${workspace.slug}/agents/${agent}` as Route, { scroll: false });
      send(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, []);

  useEffect(() => end.current?.scrollIntoView({ block: "end", behavior: "smooth" }), [messages.length, pending]);

  const use = (key: string, fn: () => Promise<{ ok: true; href: string; count?: number } | { ok: false; message: string }>, done: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return toast(res.message, "danger");
      setUsed((u) => ({ ...u, [key]: true }));
      toast(done);
      router.refresh();
    });

  const copy = AGENT_COPY[agent];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span className={cn("flex size-5 items-center justify-center rounded-md bg-accent-soft text-accent-text", busy && "animate-pulse")}>
          <Sparkles className="size-3" />
        </span>
        <span>{busy ? "Thinking…" : demo ? "Demo agent (no API key)" : "Knows your thesis, plan, tasks and team"}</span>
        {messages.length > 0 && canChat && (
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto"
            disabled={busy}
            onClick={() =>
              start(async () => {
                await newAgentConversation(workspace.id, agent);
                setMessages([]);
              })
            }
          >
            <RotateCcw className="size-3" /> New conversation
          </Button>
        )}
      </div>

      {agent === "legal" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-bg-subtle px-4 py-3 text-sm">
          <Scale className="mt-0.5 size-4 shrink-0 text-fg-muted" />
          <p>
            <span className="font-medium">Not legal advice.</span> This agent explains concepts and helps you prepare questions. It isn&apos;t a
            lawyer. For advice on your situation,{" "}
            <Link href={`/network/partners?c=legal&ws=${workspace.slug}` as Route} className="font-medium text-accent-text hover:underline">
              talk to a Legal partner
            </Link>
            .
          </p>
        </div>
      )}

      {messages.length === 0 && !pending && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-fg-muted">Try one of these, or ask your own.</p>
          {copy.starters.map((s) => (
            <button
              key={s}
              type="button"
              disabled={!canChat || busy}
              onClick={() => send(s)}
              className="rounded-lg border border-border px-3 py-2 text-left text-base hover:bg-bg-hover disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <ol className="flex flex-col gap-5">
        {messages.map((m) =>
          m.role === "USER" ? (
            <li key={m.id} className="ml-auto max-w-[85%] rounded-lg bg-bg-subtle px-3.5 py-2.5 text-base whitespace-pre-wrap">
              {m.text}
            </li>
          ) : (
            <li key={m.id} className="flex flex-col gap-3">
              <Markdown text={m.text} className="flex flex-col gap-2 text-base leading-relaxed" />
              {canChat && m.data && (m.data.suggestedTasks.length > 0 || m.data.suggestedStep) && (
                <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  {m.data.suggestedTasks.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-fg-subtle">Suggested tasks</span>
                      <ul className="flex flex-col gap-0.5 text-sm">
                        {m.data.suggestedTasks.map((t, i) => (
                          <li key={i}>· {t.title}</li>
                        ))}
                      </ul>
                      <div>
                        <Button
                          size="xs"
                          disabled={busy || used[`${m.id}:tasks`]}
                          onClick={() =>
                            use(`${m.id}:tasks`, () => addAgentTasks(workspace.id, m.data!.suggestedTasks), `${m.data!.suggestedTasks.length} added to Tasks`)
                          }
                        >
                          {used[`${m.id}:tasks`] ? <Check className="size-3" /> : <ListPlus className="size-3" />}
                          {used[`${m.id}:tasks`] ? "Added to Tasks" : "Add to Tasks"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {m.data.suggestedStep && (
                    <div className="flex flex-col gap-1.5 border-t border-border pt-2 first:border-0 first:pt-0">
                      <span className="text-xs font-medium text-fg-subtle">Suggested game-plan step</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-sm">
                        <Tag color={STAGES.find((s) => s.id === m.data!.suggestedStep!.stage)?.color ?? "gray"}>
                          {STAGES.find((s) => s.id === m.data!.suggestedStep!.stage)?.name}
                        </Tag>
                        <span className="font-medium">{m.data.suggestedStep.title}</span>
                        {m.data.suggestedStep.needs.map((n) => (
                          <Tag key={n} color={NEEDS[n].color}>
                            {NEEDS[n].label}
                          </Tag>
                        ))}
                      </span>
                      <div>
                        <Button
                          size="xs"
                          disabled={busy || used[`${m.id}:step`]}
                          onClick={() => use(`${m.id}:step`, () => addAgentStep(workspace.id, m.data!.suggestedStep), "Added to the game plan")}
                        >
                          {used[`${m.id}:step`] ? <Check className="size-3" /> : <Plus className="size-3" />}
                          {used[`${m.id}:step`] ? "Added to the game plan" : "Add to game plan"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ),
        )}
        {pending && (
          <>
            <li className="ml-auto max-w-[85%] rounded-lg bg-bg-subtle px-3.5 py-2.5 text-base whitespace-pre-wrap">{pending}</li>
            <li className="text-sm text-fg-muted">Thinking…</li>
          </>
        )}
      </ol>

      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      {canChat ? (
        <form
          className="sticky bottom-4 flex items-end gap-2 rounded-lg border border-border-strong bg-bg p-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <Textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder={`Ask ${copy.name.toLowerCase()} anything…`}
            className="max-h-40 min-h-8 resize-none border-0 bg-transparent px-1.5 py-1 [field-sizing:content] focus-visible:ring-0"
            aria-label="Message"
          />
          <Button type="submit" variant="primary" iconOnly aria-label="Send" disabled={busy || !draft.trim()}>
            <ArrowUp className="size-4" />
          </Button>
        </form>
      ) : (
        <p className="text-sm text-fg-muted">Guests can read the workspace but can&apos;t use its agents.</p>
      )}
      <div ref={end} />
    </div>
  );
}
