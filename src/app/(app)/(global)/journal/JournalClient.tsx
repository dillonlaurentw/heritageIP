"use client";

import { useState } from "react";
import { journalDelete, journalShare, journalWrite } from "@/app/actions/founder";
import { useAct } from "@/components/founder/useAct";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type Line = { id: string; who: "me" | "self"; text: string; spoken: boolean; demo: boolean; shared: boolean; at: string };

const dayLabel = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export function JournalClient({ journal, hasCircle }: { journal: { today: Line[]; earlier: { day: string; messages: Line[] }[] }; hasCircle: boolean }) {
  const { run, busy } = useAct();
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-10">
      {journal.earlier.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-fg-muted hover:text-fg">Earlier this fortnight ({journal.earlier.length} days)</summary>
          <div className="mt-4 flex flex-col gap-6">
            {journal.earlier.map((d) => (
              <div key={d.day} className="flex flex-col gap-3">
                <span className="font-mono text-2xs text-fg-subtle uppercase">{dayLabel(d.day)}</span>
                {d.messages.map((m) => (
                  <Entry key={m.id} m={m} compact />
                ))}
              </div>
            ))}
          </div>
        </details>
      )}
      <div className="flex flex-col gap-5">
        <span className="font-mono text-2xs text-fg-subtle">TODAY</span>
        {journal.today.length === 0 && <p className="text-md text-fg-subtle">Nothing yet today.</p>}
        {journal.today.map((m) => (
          <Entry
            key={m.id}
            m={m}
            actions={
              m.who === "me" && (
                <span className="flex gap-4 text-sm">
                  {hasCircle && !m.shared && (
                    <button type="button" disabled={busy} className="text-fg-muted hover:text-fg" onClick={() => run(() => journalShare(m.id), "Shared with your circle")}>
                      Share with my circle
                    </button>
                  )}
                  <button type="button" disabled={busy} className="text-fg-subtle hover:text-danger" onClick={() => run(() => journalDelete(m.id))}>
                    Delete
                  </button>
                </span>
              )
            }
          />
        ))}
        {busy && <p className="text-sm text-fg-subtle">SELF is reading…</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) run(() => journalWrite(text), undefined, () => setText(""));
        }}
        className="flex flex-col gap-3"
      >
        <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write about today" aria-label="Write about today" className="text-md leading-relaxed" />
        <Button type="submit" variant="primary" disabled={busy || !text.trim()} className="self-start">
          Add
        </Button>
      </form>
    </div>
  );
}

function Entry({ m, compact, actions }: { m: Line; compact?: boolean; actions?: React.ReactNode }) {
  if (m.who === "self")
    return (
      <div className="flex gap-3">
        <span className="w-0.5 shrink-0 rounded bg-border-strong" />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-2xs text-fg-subtle">SELF{m.demo ? " · DEMO" : ""}</span>
          <p className={cn("text-fg-muted", compact ? "text-sm" : "text-md")}>{m.text}</p>
        </div>
      </div>
    );
  return (
    <div className="group flex flex-col gap-1.5">
      <p className={cn("leading-relaxed", compact ? "text-base" : "text-lg")}>{m.text}</p>
      {(m.shared || m.spoken) && !compact && <span className="text-xs text-fg-subtle">{[m.spoken && "said out loud", m.shared && "shared with your circle"].filter(Boolean).join(" · ")}</span>}
      {actions}
    </div>
  );
}
