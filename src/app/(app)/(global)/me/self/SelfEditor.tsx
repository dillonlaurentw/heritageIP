"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { suggestSelfLines, updateSelf } from "@/app/actions/self";
import { Button } from "@/components/ui/Button";
import { Card, NeedsDot } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { FACET_COPY, FACETS, LINE_MAX, SOURCE_COPY, type Facet, type SelfLine, type SelfSuggestion } from "@/lib/self-doc";

type Op = Parameters<typeof updateSelf>[0];

function useSelfOp() {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  const run = (op: Op, done?: () => void, ok?: string) =>
    start(async () => {
      const res = await updateSelf(op);
      if (!res.ok) return toast(res.message, "danger");
      if (ok) toast(ok);
      done?.();
      router.refresh();
    });
  return { busy, run };
}

/** "Is this you?": a line your Self noticed. Yes adds it (you can reword first); no means it won't come back. */
export function Suggestions({ items, live }: { items: SelfSuggestion[]; live: boolean }) {
  const { busy, run } = useSelfOp();
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {items.map((s) => (
        <Card key={s.id} className="flex flex-col gap-3 border border-accent px-5 py-4">
          <div className="flex items-start gap-3">
            <NeedsDot className="mt-2" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-md leading-relaxed">
                <span className="font-medium">Is this you?</span>{" "}
                {editing === s.id ? null : <span className="text-fg">{s.text}</span>}
              </p>
              <p className="text-sm text-fg-muted">
                {FACET_COPY[s.facet].label} · {s.why}
                {!live && " · demo agent"}
              </p>
            </div>
          </div>
          {editing === s.id && (
            <Textarea
              aria-label="Reword it before adding"
              value={text}
              maxLength={LINE_MAX}
              onChange={(e) => setText(e.target.value)}
              className="text-base"
            />
          )}
          <div className="flex flex-wrap items-center gap-2 pl-5">
            {editing === s.id ? (
              <>
                <Button variant="primary" size="sm" disabled={busy} onClick={() => run({ type: "accept", id: s.id, text }, () => setEditing(null), "Added to your Self")}>
                  Add it
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" size="sm" disabled={busy} onClick={() => run({ type: "accept", id: s.id }, undefined, "Added to your Self")}>
                  Yes, add it
                </Button>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setEditing(s.id);
                    setText(s.text);
                  }}
                >
                  Not quite
                </Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => run({ type: "reject", id: s.id })}>
                  No
                </Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Every line of your Self, by section. Click a line to change it; nothing is hidden. */
export function SelfLines({ lines }: { lines: SelfLine[] }) {
  return (
    <Card lift className="grid grid-cols-1 gap-x-12 gap-y-9 px-8 py-9 md:grid-cols-2 md:px-10">
      {FACETS.map((f) => (
        <FacetBlock key={f} facet={f} lines={lines.filter((l) => l.facet === f)} />
      ))}
    </Card>
  );
}

function FacetBlock({ facet, lines }: { facet: Facet; lines: SelfLine[] }) {
  const { busy, run } = useSelfOp();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [text, setText] = useState("");
  const copy = FACET_COPY[facet];

  const save = () => {
    if (editing === "new") run({ type: "add", facet, text }, () => setEditing(null));
    else if (editing) run({ type: "edit", id: editing, text }, () => setEditing(null));
  };
  const editor = (
    <div className="flex flex-col gap-2">
      <Textarea
        autoFocus
        aria-label={copy.label}
        placeholder={copy.hint}
        value={text}
        maxLength={LINE_MAX}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          if (e.key === "Escape") setEditing(null);
        }}
        className="text-base"
      />
      <div className="flex items-center gap-2">
        <Button variant="primary" size="xs" disabled={busy || !text.trim()} onClick={save}>
          Save
        </Button>
        <Button variant="ghost" size="xs" onClick={() => setEditing(null)}>
          Cancel
        </Button>
        {editing !== "new" && editing && (
          <Button variant="ghost" size="xs" className="ml-auto text-fg-subtle" disabled={busy} onClick={() => run({ type: "remove", id: editing }, () => setEditing(null))}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <section className="flex flex-col gap-3" aria-label={copy.label}>
      <h2 className="text-sm text-fg-subtle">{copy.label}</h2>
      {lines.length === 0 && editing !== "new" && <p className="text-base text-fg-subtle">{copy.hint}</p>}
      {lines.map((l) =>
        editing === l.id ? (
          <div key={l.id}>{editor}</div>
        ) : (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              setEditing(l.id);
              setText(l.text);
            }}
            className="group -mx-2 flex flex-col gap-0.5 rounded-md px-2 py-1 text-left hover:bg-bg-hover"
          >
            <span className="text-md leading-relaxed">{l.text}</span>
            <span className="text-xs text-fg-subtle">
              {SOURCE_COPY[l.source]}
              {l.edited && l.source !== "you" && " · you edited this"}
              <span className="ml-2 opacity-0 transition-opacity group-hover:opacity-100">Edit</span>
            </span>
          </button>
        ),
      )}
      {editing === "new" ? (
        editor
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing("new");
            setText("");
          }}
          className={cn("flex items-center gap-1.5 self-start text-sm text-fg-muted hover:text-fg")}
        >
          <Plus className="size-3.5" /> Add a line
        </button>
      )}
    </section>
  );
}

/** Ask your Self agent to look at what you've said and done on SELF. Proposals only. */
export function FindSuggestions() {
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  return (
    <Button
      disabled={busy}
      onClick={() =>
        start(async () => {
          const res = await suggestSelfLines();
          if (!res.ok) return toast(res.message, "danger");
          toast(res.added > 0 ? `Your Self noticed ${res.added} ${res.added === 1 ? "thing" : "things"}` : "Nothing new to suggest right now");
          router.refresh();
        })
      }
    >
      {busy ? "Looking…" : "Look for new lines"}
    </Button>
  );
}
