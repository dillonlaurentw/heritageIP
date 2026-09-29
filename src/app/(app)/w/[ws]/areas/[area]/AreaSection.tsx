"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { draftAreaSection, keepAreaSection as saveSection } from "@/app/actions/areas";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

/** Lines of text: "- " lines as a quiet list, others as paragraphs. */
function Lines({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5 text-md leading-relaxed", className)}>
      {text.split("\n").map((l, i) =>
        /^[-*•]\s+/.test(l) ? (
          <p key={i} className="flex gap-2.5">
            <span aria-hidden className="text-fg-subtle">–</span>
            <span>{l.replace(/^[-*•]\s+/, "")}</span>
          </p>
        ) : (
          <p key={i}>{l}</p>
        ),
      )}
    </div>
  );
}

/**
 * One section of an area's page. The specialist drafts (or sharpens) it as a
 * proposal: Use this / Sharpen it / Discard. Only "Use this" or "Save" writes.
 */
export function AreaSection({
  workspaceId,
  area,
  section,
  saved,
  editable,
  live,
}: {
  workspaceId: string;
  area: string;
  section: { key: string; title: string; hint: string };
  saved: string;
  editable: boolean;
  live: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<{ text: string; because: string; demo: boolean } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [steer, setSteer] = useState("");
  const [busy, start] = useTransition();

  const propose = (withSteer?: string) =>
    start(async () => {
      const res = await draftAreaSection(workspaceId, area, section.key, withSteer);
      if (!res.ok) return toast(res.message, "danger");
      setDraft({ ...res.output, demo: res.demo });
      setSteer("");
    });
  const write = (text: string) =>
    start(async () => {
      const res = await saveSection(workspaceId, area, section.key, text);
      if (!res.ok) return toast(res.message, "danger");
      setDraft(null);
      setEditing(null);
      toast("Saved");
      router.refresh();
    });

  const filled = saved.trim().length > 0;
  return (
    <Card className={cn("flex flex-col gap-3 px-6 py-5", draft && "shadow-[0_0_0_1.5px_var(--accent)]")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">{section.title}</h2>
        {draft ? (
          <span className="rounded-sm bg-agent px-1.5 py-0.5 font-mono text-2xs text-fg-muted">DRAFT{draft.demo || !live ? " · demo" : ""}</span>
        ) : (
          <span className="text-xs text-fg-subtle">{filled ? "saved" : "empty"}</span>
        )}
      </div>

      {editing !== null ? (
        <>
          <Textarea autoFocus rows={6} value={editing} onChange={(e) => setEditing(e.target.value)} aria-label={section.title} className="text-base leading-relaxed" />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" disabled={busy} onClick={() => write(editing)}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </>
      ) : draft ? (
        <>
          <Lines text={draft.text} />
          <p className="text-xs text-fg-subtle">{draft.because}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button variant="primary" size="sm" disabled={busy} onClick={() => write(draft.text)}>
              Use this
            </Button>
            <Button size="sm" disabled={busy} onClick={() => setEditing(draft.text)}>
              Edit first
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setDraft(null)}>
              Discard
            </Button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (steer.trim()) propose(steer);
            }}
            className="flex gap-2"
          >
            <Input aria-label="Ask for a change" value={steer} onChange={(e) => setSteer(e.target.value)} placeholder="Sharpen it: “shorter”, “for supermarket buyers”…" />
            <Button type="submit" size="sm" disabled={busy || !steer.trim()}>
              {busy ? "Thinking…" : "Sharpen it"}
            </Button>
          </form>
        </>
      ) : (
        <>
          {filled ? <Lines text={saved} /> : <p className="text-base text-fg-subtle">{section.hint}</p>}
          {editable && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="sm" disabled={busy} onClick={() => propose()}>
                {busy ? "Thinking…" : filled ? "Sharpen it" : "Draft it"}
              </Button>
              <button type="button" onClick={() => setEditing(saved)} className="text-sm text-fg-muted hover:text-fg">
                {filled ? "Edit" : "Write it yourself"}
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
