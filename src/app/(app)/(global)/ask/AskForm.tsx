"use client";

import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { routeQuestion } from "@/app/actions/ai";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Input";

export function AskForm({ workspaces, current, question }: { workspaces: { id: string; slug: string; name: string }[]; current: string; question: string }) {
  const router = useRouter();
  const [q, setQ] = useState(question);
  const [ws, setWs] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const auto = useRef(false);

  const ask = (text = q) => {
    const w = workspaces.find((x) => x.slug === ws);
    if (!w || !text.trim()) return;
    setError(null);
    start(async () => {
      try {
        const agent = await routeQuestion(w.id, text);
        router.push(`/w/${w.slug}/agents/${agent}?q=${encodeURIComponent(text.trim())}` as Route);
      } catch {
        setError("Couldn't route that question. Try again.");
      }
    });
  };

  // A question from ⌘K goes straight through when there's only one company to ask about.
  useEffect(() => {
    if (question && workspaces.length === 1 && !auto.current) {
      auto.current = true;
      ask(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, []);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        ask();
      }}
    >
      <Field label="Your question">
        <Textarea
          rows={4}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
          }}
          placeholder="What should we do first? How do I find a manufacturer? What does vesting mean?"
        />
      </Field>
      {workspaces.length > 1 && (
        <Field label="About">
          <Select value={ws} onChange={(e) => setWs(e.target.value)}>
            {workspaces.map((w) => (
              <option key={w.slug} value={w.slug}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div>
        <Button type="submit" variant="primary" size="md" disabled={busy || !q.trim()}>
          {busy ? "Finding the right agent…" : "Ask"} <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
