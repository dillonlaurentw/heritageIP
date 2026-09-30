"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { circleCatchUp, circleSay } from "@/app/actions/founder";
import { useAct } from "@/components/founder/useAct";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";

type Circle = {
  name: string;
  messages: { id: string; text: string; at: string; fromJournal: boolean; author: { id: string; name: string } | null }[];
  summary: { text: string; helps: { from: string; to: string; why: string }[]; demo: boolean } | null;
};

export function CircleClient({ circle, me }: { circle: Circle; me: string }) {
  const router = useRouter();
  const { run, busy } = useAct();
  const [text, setText] = useState("");
  // Keep the conversation fresh while the page is open and visible.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && router.refresh(), 5000);
    return () => clearInterval(t);
  }, [router]);
  return (
    <div className="flex flex-col gap-4">
      {circle.messages.map((m, i) =>
        !m.author ? (
          <div key={m.id} className="flex flex-col items-center gap-0.5 py-3 text-center">
            <span className="font-mono text-2xs text-fg-subtle">SELF · THIS WEEK</span>
            <p className="text-md text-fg-muted">{m.text}</p>
          </div>
        ) : (
          <div key={m.id} className={cn("flex max-w-[80%] flex-col gap-1", m.author.id === me ? "self-end items-end" : "self-start")}>
            {m.author.id !== me && circle.messages[i - 1]?.author?.id !== m.author.id && <span className="px-1 text-xs text-fg-subtle">{m.author.name.split(" ")[0]}</span>}
            <p className={cn("rounded-[18px] px-4 py-2 text-base", m.author.id === me ? "bg-primary text-primary-fg" : "bg-surface shadow-card")}>{m.text}</p>
            <span className="px-1 text-2xs text-fg-subtle">
              {timeAgo(new Date(m.at))}
              {m.fromJournal ? " · from journal" : ""}
            </span>
          </div>
        ),
      )}
      {circle.summary ? (
        <Card className="flex flex-col gap-2 px-5 py-4">
          <span className="font-mono text-2xs text-fg-subtle">SELF · CATCH-UP{circle.summary.demo ? " · DEMO" : ""}</span>
          <p className="text-base">{circle.summary.text}</p>
          {circle.summary.helps.map((h, i) => (
            <p key={i} className="text-sm text-fg-muted">
              {h.from} could help {h.to}: {h.why}
            </p>
          ))}
        </Card>
      ) : (
        <Button size="sm" disabled={busy} className="self-start" onClick={() => run(() => circleCatchUp())}>
          Catch me up
        </Button>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) run(() => circleSay(text), undefined, () => setText(""));
        }}
        className="mt-4 flex flex-col gap-2"
      >
        <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Say something to ${circle.name.split(" · ")[0]}`} aria-label="Message your circle" />
        <Button type="submit" variant="primary" size="sm" disabled={busy || !text.trim()} className="self-start">
          Send
        </Button>
      </form>
    </div>
  );
}
