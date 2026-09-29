"use client";

import { ArrowUp, Check, Sparkles, X } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addTasksFromPage, askPage } from "@/app/actions/ai";
import type { SelfEditor } from "@/components/editor/schema";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { PAGE_ACTIONS, type PageActionKey } from "@/lib/workspace-agents";
import { Markdown } from "./Markdown";

/** What was selected when "Ask AI" opened: block ids + the same blocks as Markdown. */
export type AskTarget = { blockIds: string[]; markdown: string };

type Result =
  | { kind: "text"; markdown: string; note: string; action: PageActionKey }
  | { kind: "tasks"; tasks: { title: string; detail: string; keep: boolean }[]; note: string };

/**
 * "Ask AI" for a page. Agents propose, people dispose: the answer is a
 * preview until you insert it, replace the selection with it, or add the tasks.
 */
export function AskAIPanel({
  pageId,
  editor,
  target,
  onClose,
}: {
  pageId: string;
  editor: SelfEditor | null;
  target: AskTarget | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const last = useRef<{ action: PageActionKey; instruction: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const hasSelection = Boolean(target?.markdown.trim());

  const run = (action: PageActionKey, text = instruction) => {
    last.current = { action, instruction: text };
    setError(null);
    start(async () => {
      const pageText = editor ? editor.blocksToMarkdownLossy(editor.document) : "";
      const res = await askPage(pageId, { action, instruction: text, selection: target?.markdown ?? "", pageText });
      if (!res.ok) return setError(res.message);
      setDemo(res.demo);
      if (action === "tasks") {
        setResult({ kind: "tasks", note: res.output.note, tasks: res.output.tasks.map((t) => ({ ...t, keep: true })) });
      } else {
        setResult({ kind: "text", action, markdown: res.output.markdown, note: res.output.note });
      }
    });
  };

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const blocksFor = (markdown: string) => (editor ? editor.tryParseMarkdownToBlocks(markdown) : []);

  const insert = (replace: boolean) => {
    if (!editor || result?.kind !== "text") return;
    const blocks = blocksFor(result.markdown);
    if (!blocks.length) return;
    const ids = target?.blockIds.filter((id) => editor.getBlock(id)) ?? [];
    if (replace && ids.length) editor.replaceBlocks(ids, blocks);
    else {
      const at = ids.length ? ids[ids.length - 1] : editor.getTextCursorPosition().block.id;
      editor.insertBlocks(blocks, at, "after");
    }
    toast(replace ? "Replaced" : "Inserted");
    onClose();
  };

  const addTasks = () => {
    if (result?.kind !== "tasks") return;
    const kept = result.tasks.filter((t) => t.keep && t.title.trim());
    start(async () => {
      const res = await addTasksFromPage(pageId, kept.map(({ title, detail }) => ({ title, detail })));
      if (!res.ok) return setError(res.message);
      toast(`${res.count} ${res.count === 1 ? "task" : "tasks"} added to Tasks`);
      onClose();
      router.push(res.href as Route);
    });
  };

  const actions = PAGE_ACTIONS.filter((a) => !a.needsSelection || hasSelection);
  const keptCount = result?.kind === "tasks" ? result.tasks.filter((t) => t.keep).length : 0;

  return (
    <div
      role="dialog"
      aria-label="Ask AI"
      className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-h-[70vh] max-w-[680px] flex-col overflow-hidden rounded-xl border border-border bg-bg-popover shadow-dialog"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-fg-muted">
        <span className={cn("flex size-5 items-center justify-center rounded-md bg-accent-soft text-accent-text", busy && "animate-pulse")}>
          <Sparkles className="size-3" />
        </span>
        <span className="font-medium text-fg">Ask AI</span>
        {hasSelection && <span>· on the selection</span>}
        {demo && <span>· Demo agent (no API key)</span>}
        <span className="flex-1" />
        <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-bg-hover">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {busy && !result && (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-fg-muted">
            <Spinner /> Thinking…
          </div>
        )}

        {result?.kind === "text" && (
          <div className="px-4 py-4">
            <Markdown text={result.markdown || "_Nothing came back. Try again or add an instruction._"} className="flex flex-col gap-2 text-base leading-relaxed" />
            {result.note && <p className="mt-3 text-xs text-fg-subtle">{result.note}</p>}
          </div>
        )}

        {result?.kind === "tasks" && (
          <div className="px-4 py-3">
            {result.tasks.length === 0 ? (
              <p className="py-3 text-sm text-fg-muted">No action items found here.</p>
            ) : (
              <ul className="flex flex-col">
                {result.tasks.map((t, i) => (
                  <li key={i} className={cn("flex items-start gap-2.5 py-1.5", !t.keep && "opacity-50")}>
                    <button
                      type="button"
                      aria-label={t.keep ? "Leave this out" : "Keep this"}
                      onClick={() => setResult({ ...result, tasks: result.tasks.map((x, j) => (j === i ? { ...x, keep: !x.keep } : x)) })}
                      className={cn(
                        "mt-1 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        t.keep ? "border-primary bg-primary text-primary-fg" : "border-border-strong",
                      )}
                    >
                      {t.keep && <Check className="size-3" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <input
                        aria-label="Task"
                        value={t.title}
                        onChange={(e) => setResult({ ...result, tasks: result.tasks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                        className="w-full bg-transparent text-base outline-none"
                      />
                      {t.detail && <p className="text-sm text-fg-muted">{t.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {result.note && <p className="mt-2 text-xs text-fg-subtle">{result.note}</p>}
          </div>
        )}

        {!result && !busy && (
          <div className="flex flex-wrap gap-1.5 px-3 py-3">
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                title={a.hint}
                onClick={() => run(a.key)}
                className="h-7 rounded-md border border-border px-2.5 text-sm hover:bg-bg-hover"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mx-3 mb-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      </div>

      {result ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2.5">
          {result.kind === "text" ? (
            <>
              {hasSelection && (result.action === "rewrite" || result.action === "shorter" || result.action === "draft") && (
                <Button variant="primary" size="sm" onClick={() => insert(true)} disabled={busy || !result.markdown}>
                  Replace selection
                </Button>
              )}
              <Button variant={hasSelection && result.action !== "summarize" && result.action !== "continue" ? "secondary" : "primary"} size="sm" onClick={() => insert(false)} disabled={busy || !result.markdown}>
                Insert below
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={addTasks} disabled={busy || keptCount === 0}>
              Add {keptCount} {keptCount === 1 ? "task" : "tasks"} to Tasks
            </Button>
          )}
          <Button size="sm" onClick={() => last.current && run(last.current.action, last.current.instruction)} disabled={busy}>
            {busy ? "Thinking…" : "Try again"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setResult(null)} disabled={busy}>
            Discard
          </Button>
          <span className="ml-auto text-xs text-fg-subtle">Nothing changes until you choose.</span>
        </div>
      ) : (
        <form
          className="flex items-center gap-2 border-t border-border px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (instruction.trim()) run(hasSelection ? "rewrite" : "draft");
          }}
        >
          <input
            ref={input}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={hasSelection ? "Tell SELF what to do with the selection…" : "Tell SELF what to write…"}
            className="h-8 flex-1 bg-transparent text-base outline-none placeholder:text-fg-subtle"
            disabled={busy}
          />
          <Button type="submit" variant="primary" size="sm" iconOnly aria-label="Ask" disabled={busy || !instruction.trim()}>
            <ArrowUp className="size-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
