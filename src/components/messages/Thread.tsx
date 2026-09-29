"use client";

import { ArrowUp } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { answerTrialWeek, pollThread, proposeTrialWeek, sendDirectMessage, type ThreadMessage } from "@/app/actions/messages";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import type { TrialData } from "@/lib/message-rules";

type Person = { id: string; name: string; headline: string | null };
type TrialOption = { id: string; name: string; roles: { id: string; title: string }[] };

/** One conversation: messages, a composer, and (for owners and admins) "propose a trial week". Polls while open. */
export function Thread({
  conversationId,
  me,
  other,
  about,
  initial,
  trialOptions,
  rehearseHref,
}: {
  conversationId: string;
  me: Person;
  other: Person | null;
  about: { name: string; slug: string } | null;
  initial: ThreadMessage[];
  trialOptions: TrialOption[];
  rehearseHref: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [proposing, setProposing] = useState(false);
  const [busy, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      const res = await pollThread(conversationId);
      if (res.ok) setMessages(res.messages);
    };
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [conversationId]);

  const refresh = async () => {
    const res = await pollThread(conversationId);
    if (res.ok) setMessages(res.messages);
  };

  const send = () => {
    const body = text.trim();
    if (!body) return;
    start(async () => {
      const res = await sendDirectMessage(conversationId, body);
      if (!res.ok) return toast(res.message, "danger");
      setText("");
      await refresh();
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
        {other && <Avatar name={other.name} size="lg" />}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-medium">{other?.name ?? "Someone who left"}</span>
          <span className="truncate text-sm text-fg-muted">{[other?.headline, about && `about ${about.name}`].filter(Boolean).join(" · ")}</span>
        </span>
        {rehearseHref && (
          <Link href={rehearseHref as Route} className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
            Rehearse a hard conversation <span className="rounded-sm bg-agent px-1.5 py-0.5 font-mono text-2xs">SIMULATION</span>
          </Link>
        )}
        {trialOptions.length > 0 && !proposing && (
          <Button size="sm" onClick={() => setProposing(true)}>
            Propose a trial week
          </Button>
        )}
      </header>

      <div className="scroll-quiet flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-6">
        {messages.length === 0 && <p className="m-auto text-sm text-fg-subtle">Say hello. Messages here are only between the two of you.</p>}
        {messages.map((m) =>
          m.kind === "NOTE" ? (
            <p key={m.id} className="self-center py-1 text-center text-sm text-fg-subtle">
              {m.text}
            </p>
          ) : m.kind === "TRIAL_PROPOSAL" ? (
            <TrialCard key={m.id} m={m} mine={m.authorId === me.id} otherName={other?.name ?? "them"} onDone={async () => (await refresh(), router.refresh())} />
          ) : (
            <div key={m.id} className={cn("flex max-w-[80%] flex-col gap-1", m.authorId === me.id ? "self-end items-end" : "self-start")}>
              <p
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap",
                  m.authorId === me.id ? "rounded-br-md bg-primary text-primary-fg" : "rounded-bl-md bg-surface shadow-card",
                )}
              >
                {m.text}
              </p>
            </div>
          ),
        )}
        {proposing && (
          <ProposeTrial
            options={trialOptions}
            otherName={other?.name ?? "them"}
            onCancel={() => setProposing(false)}
            onSend={(input) =>
              start(async () => {
                const res = await proposeTrialWeek(conversationId, input);
                if (!res.ok) return toast(res.message, "danger");
                setProposing(false);
                await refresh();
              })
            }
            busy={busy}
          />
        )}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-border px-4 py-3"
      >
        <label htmlFor="dm" className="sr-only">
          Message
        </label>
        <textarea
          id="dm"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={other ? `Message ${other.name.split(" ")[0]}` : "Message"}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-lg bg-surface px-4 py-2.5 text-base [field-sizing:content] shadow-card outline-none focus:ring-2 focus:ring-accent-soft"
        />
        <Button type="submit" variant="primary" iconOnly size="md" aria-label="Send" disabled={busy || !text.trim()}>
          <ArrowUp className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function TrialCard({ m, mine, otherName, onDone }: { m: ThreadMessage; mine: boolean; otherName: string; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [busy, start] = useTransition();
  const t = m.data as TrialData;
  const act = (a: "accept" | "decline" | "withdraw", ok: string) =>
    start(async () => {
      const res = await answerTrialWeek(m.id, a);
      if (!res.ok) return toast(res.message, "danger");
      toast(ok);
      await onDone();
    });
  const status = { PENDING: "Waiting for an answer", ACCEPTED: "Accepted", DECLINED: "Not now", WITHDRAWN: "Withdrawn" }[t.status];
  return (
    <Card lift className={cn("flex w-full max-w-lg flex-col gap-3 p-6", mine ? "self-end" : "self-start")}>
      <span className="flex items-center justify-between text-sm text-fg-subtle">
        <span>A trial week at {t.workspaceName}</span>
        <span className={cn(t.status === "PENDING" && !mine && "text-accent-text")}>{status}</span>
      </span>
      <span className="text-xl font-medium">{t.title}</span>
      {t.focus && <p className="text-base leading-relaxed text-fg-muted">{t.focus}</p>}
      <p className="text-sm text-fg-subtle">A week working on something real together. No money, no terms. Saying yes adds you to the company as a member; either of you can end it.</p>
      {t.status === "PENDING" && (
        <div className="flex flex-wrap gap-2 pt-1">
          {mine ? (
            <Button size="sm" disabled={busy} onClick={() => act("withdraw", "Withdrawn")}>
              Withdraw
            </Button>
          ) : (
            <>
              <Button variant="primary" size="md" disabled={busy} onClick={() => act("accept", `You joined ${t.workspaceName}`)}>
                Say yes to the week
              </Button>
              <Button size="md" disabled={busy} onClick={() => act("decline", "Passed for now")}>
                Not now
              </Button>
            </>
          )}
        </div>
      )}
      {t.status === "ACCEPTED" && <p className="text-sm">{mine ? `${otherName} joined.` : "You're in. Welcome."}</p>}
    </Card>
  );
}

function ProposeTrial({
  options,
  otherName,
  onCancel,
  onSend,
  busy,
}: {
  options: TrialOption[];
  otherName: string;
  onCancel: () => void;
  onSend: (i: { workspaceId: string; roleId: string | null; title: string; focus: string }) => void;
  busy: boolean;
}) {
  const [ws, setWs] = useState(options[0]!.id);
  const roles = options.find((o) => o.id === ws)?.roles ?? [];
  const [roleId, setRoleId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [focus, setFocus] = useState("");
  return (
    <Card lift className="flex w-full max-w-lg flex-col gap-4 self-end p-6">
      <span className="text-lg font-medium">Propose a trial week with {otherName.split(" ")[0]}</span>
      {options.length > 1 && (
        <Field label="Company">
          <Select value={ws} onChange={(e) => (setWs(e.target.value), setRoleId(""))}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {roles.length > 0 && (
        <Field label="For which role">
          <Select
            value={roleId}
            onChange={(e) => {
              setRoleId(e.target.value);
              const r = roles.find((x) => x.id === e.target.value);
              if (r && !title) setTitle(r.title);
            }}
          >
            <option value="">Not a specific role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="What they'd work on">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brand and a one-page site for buyers" />
      </Field>
      <Field label="What the week is for" hint="What you'd both like to find out.">
        <Textarea rows={3} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Whether we work well together before we talk about anything bigger." />
      </Field>
      <div className="flex gap-2">
        <Button variant="primary" size="md" disabled={busy || !title.trim()} onClick={() => onSend({ workspaceId: ws, roleId: roleId || null, title, focus })}>
          Propose the week
        </Button>
        <Button variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
