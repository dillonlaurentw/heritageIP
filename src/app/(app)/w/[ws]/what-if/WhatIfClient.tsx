"use client";

import { Check } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addWhatIfChanges, checkWhatIf } from "@/app/actions/what-if";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

export function AskWhatIf({ workspaceId, slug, ideas }: { workspaceId: string; slug: string; ideas: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState("");
  const [busy, start] = useTransition();
  const run = (scenario: string) =>
    start(async () => {
      const res = await checkWhatIf(workspaceId, scenario);
      if (!res.ok) return toast(res.message, "danger");
      setText("");
      router.push(`/w/${slug}/what-if?check=${res.id}` as Route);
    });
  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) run(text);
        }}
        className="flex items-center gap-3 rounded-xl bg-surface px-5 py-3 shadow-lift"
      >
        <label htmlFor="whatif" className="sr-only">
          What if
        </label>
        <input
          id="whatif"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Our supplier's sample run fails in November"
          className="min-w-0 flex-1 bg-transparent text-xl outline-none placeholder:text-fg-subtle"
        />
        <Button type="submit" variant="primary" size="md" disabled={busy || !text.trim()}>
          {busy ? "Checking…" : "Check it"}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {ideas.map((i) => (
          <button key={i} type="button" disabled={busy} onClick={() => run(i)} className="rounded-full px-3.5 py-1.5 text-sm text-fg-muted shadow-[inset_0_0_0_1px_var(--border-strong)] hover:text-fg">
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PickChanges({
  workspaceId,
  checkId,
  changes,
  applied,
  editable,
}: {
  workspaceId: string;
  checkId: string;
  changes: { title: string; detail: string }[];
  applied: number[];
  editable: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [picked, setPicked] = useState<number[]>(changes.map((_, i) => i).filter((i) => !applied.includes(i)).slice(0, 2));
  const [busy, start] = useTransition();
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>Suggested changes</Eyebrow>
      {changes.map((c, i) => {
        const done = applied.includes(i);
        const on = picked.includes(i);
        return (
          <Card key={i} className={cn("flex gap-3 px-4 py-3", done && "opacity-60")}>
            <button
              type="button"
              disabled={done || !editable}
              aria-pressed={on}
              aria-label={`Add “${c.title}”`}
              onClick={() => toggle(i)}
              className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md", done || on ? "bg-primary text-primary-fg" : "shadow-[inset_0_0_0_1.5px_var(--border-strong)]")}
            >
              {(done || on) && <Check className="size-3.5" />}
            </button>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{c.title}</span>
              <span className="text-xs text-fg-muted">{done ? "In the plan" : c.detail}</span>
            </span>
          </Card>
        );
      })}
      {editable && (
        <Button
          variant="primary"
          size="lg"
          className="mt-1"
          disabled={busy || picked.filter((i) => !applied.includes(i)).length === 0}
          onClick={() =>
            start(async () => {
              const res = await addWhatIfChanges(workspaceId, checkId, picked);
              if (!res.ok) return toast(res.message, "danger");
              toast(`Added ${res.added} ${res.added === 1 ? "step" : "steps"} to the plan`);
              setPicked([]);
              router.refresh();
            })
          }
        >
          Add {picked.filter((i) => !applied.includes(i)).length || ""} {picked.length === 1 ? "change" : "changes"} to the plan
        </Button>
      )}
    </div>
  );
}
