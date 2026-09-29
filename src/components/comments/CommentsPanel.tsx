"use client";

import { Check, MoreHorizontal, RotateCcw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { loadThreads, postComment, removeComment, resolveThread } from "@/app/actions/comments";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";

type Person = { id: string; name: string };
type Reply = { id: string; body: string; author: string; authorId: string; at: string };
type Thread = Reply & { blockId: string | null; quote: string | null; resolved: boolean; replies: Reply[] };
export type CommentAnchor = { blockId: string; quote: string };

/** Show "@Name" tokens for known people as mentions. Plain text otherwise; never HTML. */
function Body({ text, people }: { text: string; people: Person[] }) {
  if (!people.length) return <>{text}</>;
  const names = people.map((p) => p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length);
  const parts = text.split(new RegExp(`(@(?:${names.join("|")}))`, "g"));
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") && people.some((p) => `@${p.name}` === part) ? (
          <span key={i} className="rounded-sm bg-accent-soft px-0.5 font-medium text-accent-text">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * A comment box with @mention autocomplete. Mentioned ids are those whose
 * "@Name" is still in the text when it's sent.
 */
function Composer({
  people,
  placeholder,
  autoFocus,
  onSend,
  compact,
}: {
  people: Person[];
  placeholder: string;
  autoFocus?: boolean;
  compact?: boolean;
  onSend: (body: string, mentions: string[]) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const matches = query === null ? [] : people.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  const onChange = (value: string) => {
    setText(value);
    const caret = ref.current?.selectionStart ?? value.length;
    const m = /(^|\s)@([\p{L} ]{0,20})$/u.exec(value.slice(0, caret));
    setQuery(m ? m[2] : null);
  };
  const pick = (p: Person) => {
    const caret = ref.current?.selectionStart ?? text.length;
    const before = text.slice(0, caret).replace(/@([\p{L} ]{0,20})$/u, `@${p.name} `);
    setText(before + text.slice(caret));
    setQuery(null);
    ref.current?.focus();
  };
  const send = () =>
    start(async () => {
      const body = text.trim();
      if (!body) return;
      const mentions = people.filter((p) => body.includes(`@${p.name}`)).map((p) => p.id);
      if (await onSend(body, mentions)) setText("");
    });

  return (
    <div className="relative">
      <textarea
        ref={ref}
        autoFocus={autoFocus}
        rows={compact ? 1 : 2}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (matches.length && (e.key === "Enter" || e.key === "Tab")) {
            e.preventDefault();
            pick(matches[0]);
          } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          } else if (e.key === "Escape") setQuery(null);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full resize-none rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm outline-none [field-sizing:content] placeholder:text-fg-subtle focus:border-accent"
        disabled={busy}
      />
      {matches.length > 0 && (
        <ul className="absolute bottom-full left-0 z-10 mb-1 w-56 rounded-lg bg-bg-popover p-1 shadow-popover">
          {matches.map((p) => (
            <li key={p.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-bg-hover">
                <Avatar name={p.name} size="sm" /> {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {busy && <Spinner className="absolute top-2 right-2" />}
    </div>
  );
}

function CommentRow({ c, me, canManage, people, onDelete, extra }: { c: Reply; me: string; canManage: boolean; people: Person[]; onDelete: () => void; extra?: ReactNode }) {
  return (
    <div className="group/c flex gap-2">
      <Avatar name={c.author} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs">
          <span className="font-medium">{c.author}</span>
          <span className="text-fg-subtle">{timeAgo(c.at)}</span>
          <span className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/c:opacity-100 focus-within:opacity-100">
            {extra}
            {(c.authorId === me || canManage) && (
              <Menu
                align="end"
                trigger={
                  <button type="button" aria-label="Comment options" className="rounded p-0.5 hover:bg-bg-hover">
                    <MoreHorizontal className="size-3.5" />
                  </button>
                }
              >
                <MenuItem icon={<Trash2 />} danger onClick={onDelete}>
                  Delete
                </MenuItem>
              </Menu>
            )}
          </span>
        </p>
        <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">
          <Body text={c.body} people={people} />
        </p>
      </div>
    </div>
  );
}

/** Scroll the editor to a block and flash it. Retries briefly while the editor loads. */
function showBlock(blockId: string | null, tries = 12) {
  if (!blockId) return;
  const el = document.querySelector<HTMLElement>(`.bn-block[data-id="${CSS.escape(blockId)}"]`);
  if (!el) {
    if (tries > 0) setTimeout(() => showBlock(blockId, tries - 1), 250);
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  // The editor owns its DOM (it would undo a class change), so flash an overlay on top instead.
  const flash = () => {
    const r = el.getBoundingClientRect();
    const o = document.createElement("div");
    o.className = "self-comment-flash";
    Object.assign(o.style, { position: "fixed", left: `${r.left - 4}px`, top: `${r.top - 2}px`, width: `${r.width + 8}px`, height: `${r.height + 4}px` });
    document.body.appendChild(o);
    setTimeout(() => o.remove(), 1800);
  };
  setTimeout(flash, 350);
}

/** The comments sheet on a page: threads (open, then resolved), replies, and a new-comment box. */
export function CommentsPanel({
  pageId,
  me,
  canManage,
  people,
  anchor,
  focusId,
  onClose,
  onCount,
}: {
  pageId: string;
  me: string;
  canManage: boolean;
  people: Person[];
  anchor: CommentAnchor | null;
  focusId?: string | null;
  onClose: () => void;
  onCount?: (open: number) => void;
}) {
  const toast = useToast();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [draftAnchor, setDraftAnchor] = useState(anchor);

  const reload = useCallback(async () => {
    const t = await loadThreads(pageId);
    setThreads(t);
    onCount?.(t.filter((x) => !x.resolved).length);
  }, [pageId, onCount]);

  useEffect(() => {
    let alive = true;
    loadThreads(pageId).then((t) => {
      if (!alive) return;
      setThreads(t);
      onCount?.(t.filter((x) => !x.resolved).length);
    });
    return () => {
      alive = false;
    };
  }, [pageId, onCount]);

  useEffect(() => {
    if (!focusId || !threads) return;
    const t = threads.find((x) => x.id === focusId);
    if (!t) return;
    document.getElementById(`thread-${t.id}`)?.scrollIntoView({ block: "center" });
    showBlock(t.blockId);
  }, [focusId, threads]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = async (input: { body: string; mentions: string[]; parentId?: string; anchor?: CommentAnchor | null }) => {
    const res = await postComment({
      pageId,
      body: input.body,
      mentions: input.mentions,
      parentId: input.parentId ?? null,
      blockId: input.anchor?.blockId ?? null,
      quote: input.anchor?.quote ?? null,
    });
    if (!res.ok) {
      toast(res.message, "danger");
      return false;
    }
    if (!input.parentId) setDraftAnchor(null);
    await reload();
    return true;
  };
  const act = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    const res = await fn();
    if (!res.ok) toast(res.message ?? "Couldn't do that.", "danger");
    await reload();
  };

  const open = threads?.filter((t) => !t.resolved) ?? [];
  const resolved = threads?.filter((t) => t.resolved) ?? [];
  const shown = showResolved ? resolved : open;

  return (
    <aside
      aria-label="Comments"
      className="fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-border bg-bg shadow-popover sm:top-11 sm:shadow-none"
    >
      <div className="flex h-11 items-center gap-2 border-b border-border px-4">
        <h2 className="text-sm font-semibold">Comments</h2>
        <div className="ml-2 flex gap-1 text-xs">
          <button type="button" onClick={() => setShowResolved(false)} className={cn("rounded px-1.5 py-0.5", !showResolved ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover")}>
            Open {open.length > 0 && open.length}
          </button>
          <button type="button" onClick={() => setShowResolved(true)} className={cn("rounded px-1.5 py-0.5", showResolved ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover")}>
            Resolved {resolved.length > 0 && resolved.length}
          </button>
        </div>
        <button type="button" onClick={onClose} aria-label="Close comments" className="ml-auto rounded p-1 hover:bg-bg-hover">
          <X className="size-4" />
        </button>
      </div>

      <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {!threads ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-subtle">{showResolved ? "Nothing resolved yet." : "No open comments. Start one below, or select text and choose Comment."}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((t) => (
              <li key={t.id} id={`thread-${t.id}`} className={cn("flex flex-col gap-3 rounded-lg border border-border p-3", focusId === t.id && "border-accent/50")}>
                {t.quote && (
                  <button type="button" onClick={() => showBlock(t.blockId)} className="border-l-2 border-accent/60 pl-2 text-left text-xs text-fg-muted hover:text-fg">
                    {t.quote}
                  </button>
                )}
                <CommentRow
                  c={t}
                  me={me}
                  canManage={canManage}
                  people={people}
                  onDelete={() => act(() => removeComment(t.id))}
                  extra={
                    <button
                      type="button"
                      aria-label={t.resolved ? "Reopen" : "Resolve"}
                      title={t.resolved ? "Reopen" : "Resolve"}
                      onClick={() => act(() => resolveThread(t.id, !t.resolved))}
                      className="rounded p-0.5 hover:bg-bg-hover"
                    >
                      {t.resolved ? <RotateCcw className="size-3.5" /> : <Check className="size-3.5" />}
                    </button>
                  }
                />
                {t.replies.map((r) => (
                  <CommentRow key={r.id} c={r} me={me} canManage={canManage} people={people} onDelete={() => act(() => removeComment(r.id))} />
                ))}
                {!t.resolved && <Composer compact people={people} placeholder="Reply…" onSend={(body, mentions) => send({ body, mentions, parentId: t.id })} />}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        {draftAnchor && (
          <div className="mb-2 flex items-start gap-2">
            <p className="line-clamp-2 flex-1 border-l-2 border-accent/60 pl-2 text-xs text-fg-muted">{draftAnchor.quote}</p>
            <Button iconOnly size="xs" variant="ghost" aria-label="Comment on the whole page instead" onClick={() => setDraftAnchor(null)}>
              <X className="size-3" />
            </Button>
          </div>
        )}
        <Composer
          key={draftAnchor?.blockId ?? "page"}
          autoFocus={Boolean(draftAnchor)}
          people={people}
          placeholder={draftAnchor ? "Comment on the selection…" : "Add a comment… (@ to mention)"}
          onSend={(body, mentions) => send({ body, mentions, anchor: draftAnchor })}
        />
      </div>
    </aside>
  );
}
