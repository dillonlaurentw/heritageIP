"use client";

import { ArrowRight, CornerDownLeft, FileText, Search, Sparkles } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { PageIcon } from "@/components/ui/PageIcon";
import { cn } from "@/lib/cn";
import { useShell } from "./ShellContext";
import { toggleThemeQuick } from "./ThemeToggle";
import type { PaletteItem } from "./types";

/**
 * ⌘K. Jump to any page or place, run an action, or (from Phase 5) ask SELF.
 * Static items are filtered locally; `search` adds page results from the server.
 */
export function CommandPalette({
  items,
  search,
  onAction,
}: {
  items: PaletteItem[];
  search?: (q: string) => Promise<PaletteItem[]>;
  onAction?: (action: string, query: string) => void;
}) {
  const { paletteOpen, setPaletteOpen, paletteQuery } = useShell();
  const router = useRouter();
  const [q, setQ] = useState(paletteQuery);
  const [remote, setRemote] = useState<PaletteItem[]>([]);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paletteOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the query each time the palette opens
      setQ(paletteQuery);
      setActive(0);
    }
  }, [paletteOpen, paletteQuery]);

  useEffect(() => {
    if (!search || !paletteOpen) return;
    let alive = true;
    const t = setTimeout(async () => {
      const res = await search(q.trim());
      if (alive) setRemote(res);
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, search, paletteOpen]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const local = items.filter((i) => !needle || `${i.label} ${i.keywords ?? ""} ${i.group}`.toLowerCase().includes(needle));
    const all = [...remote, ...local];
    // Ask SELF is always last when there's a question typed.
    if (needle && onAction) all.push({ id: "ask", label: `Ask SELF: “${q.trim()}”`, group: "Ask", action: "ask" });
    return all;
  }, [items, remote, q, onAction]);

  const run = (item: PaletteItem) => {
    setPaletteOpen(false);
    if (item.href) router.push(item.href as Route);
    else if (item.action === "theme") toggleThemeQuick();
    else if (item.action) onAction?.(item.action, q.trim());
  };

  const groups = results.reduce<Record<string, (PaletteItem & { i: number })[]>>((acc, r, i) => {
    (acc[r.group] ??= []).push({ ...r, i });
    return acc;
  }, {});

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen} top className="w-[40rem] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Search className="size-4 text-fg-subtle" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              run(results[active]);
            }
          }}
          placeholder="Search pages, jump anywhere, or ask SELF…"
          aria-label="Search"
          className="h-12 flex-1 bg-transparent text-md outline-none"
        />
      </div>
      <div ref={listRef} role="listbox" className="scroll-quiet max-h-[min(60vh,28rem)] overflow-y-auto p-2">
        {results.length === 0 && <p className="px-2 py-6 text-center text-sm text-fg-muted">Nothing found.</p>}
        {Object.entries(groups).map(([group, list]) => (
          <div key={group} className="mb-1">
            <div className="px-2 pt-2 pb-1 text-xs font-medium text-fg-subtle">{group}</div>
            {list.map((item) => {
              const i = item.i;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(item)}
                  className={cn(
                    "flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-base",
                    i === active && "bg-bg-hover",
                  )}
                >
                  {item.action === "ask" ? (
                    <Sparkles className="size-4 text-accent-text" />
                  ) : item.href && item.icon !== undefined ? (
                    <PageIcon icon={item.icon} />
                  ) : item.href ? (
                    <FileText className="size-4 text-fg-subtle" />
                  ) : (
                    <ArrowRight className="size-4 text-fg-subtle" />
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="truncate text-xs text-fg-subtle">{item.hint}</span>}
                  {i === active && <CornerDownLeft className="size-3.5 text-fg-subtle" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
