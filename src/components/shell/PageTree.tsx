"use client";

import { ChevronRight, Database, MoreHorizontal, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PageIcon } from "@/components/ui/PageIcon";
import { cn } from "@/lib/cn";
import { useShell } from "./ShellContext";
import type { TreeNode } from "./types";

const KEY = "self-tree-open";

function useOpenSet() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore expanded rows from localStorage once
      setOpen(new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]));
    } catch {}
  }, []);
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      localStorage.setItem(KEY, JSON.stringify([...n]));
      return n;
    });
  return { open, toggle };
}

export type TreeHandlers = {
  onAddChild?: (parentId: string) => void;
  renderMenu?: (node: TreeNode, trigger: ReactNode) => ReactNode;
  onDropNode?: (dragId: string, targetId: string, where: "before" | "inside" | "after") => void;
};

/** The sidebar's nested page list. Expanded rows are remembered per browser. */
export function PageTree({ nodes, handlers = {}, emptyLabel }: { nodes: TreeNode[]; handlers?: TreeHandlers; emptyLabel?: string }) {
  const { open, toggle } = useOpenSet();
  if (nodes.length === 0 && emptyLabel) return <p className="px-2 py-1 text-sm text-fg-subtle">{emptyLabel}</p>;
  return (
    <ul role="tree" className="flex flex-col">
      {nodes.map((n) => (
        <Row key={n.id} node={n} depth={0} open={open} toggle={toggle} handlers={handlers} />
      ))}
    </ul>
  );
}

function Row({
  node,
  depth,
  open,
  toggle,
  handlers,
}: {
  node: TreeNode;
  depth: number;
  open: Set<string>;
  toggle: (id: string) => void;
  handlers: TreeHandlers;
}) {
  const pathname = usePathname();
  const { closeSidebarOnMobile } = useShell();
  const active = pathname === node.href;
  const isOpen = open.has(node.id);
  const [drop, setDrop] = useState<null | "before" | "inside" | "after">(null);
  const canExpand = node.kind === "PAGE";

  return (
    <li role="treeitem" aria-expanded={canExpand ? isOpen : undefined} aria-selected={active}>
      <div
        draggable={Boolean(handlers.onDropNode)}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/self-page", node.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => {
          if (!handlers.onDropNode || !e.dataTransfer.types.includes("text/self-page")) return;
          e.preventDefault();
          const r = e.currentTarget.getBoundingClientRect();
          const y = (e.clientY - r.top) / r.height;
          setDrop(y < 0.25 ? "before" : y > 0.75 ? "after" : canExpand ? "inside" : "after");
        }}
        onDragLeave={() => setDrop(null)}
        onDrop={(e) => {
          const id = e.dataTransfer.getData("text/self-page");
          const where = drop;
          setDrop(null);
          if (id && where && id !== node.id) {
            e.preventDefault();
            handlers.onDropNode?.(id, node.id, where);
          }
        }}
        className={cn(
          "group relative flex h-7 items-center gap-1 rounded-md pr-1 text-sm text-fg-muted hover:bg-bg-hover",
          active && "bg-bg-active font-medium text-fg",
          drop === "inside" && "bg-accent-soft",
        )}
        style={{ paddingLeft: 4 + depth * 12 }}
      >
        {drop === "before" && <span className="absolute inset-x-1 -top-px h-0.5 rounded bg-accent" />}
        {drop === "after" && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded bg-accent" />}
        <button
          type="button"
          aria-label={isOpen ? "Collapse" : "Expand"}
          onClick={() => toggle(node.id)}
          className={cn("flex size-5 shrink-0 items-center justify-center rounded-sm hover:bg-bg-active", !canExpand && "invisible")}
        >
          <ChevronRight className={cn("size-3.5 transition-transform duration-(--duration-fast)", isOpen && "rotate-90")} />
        </button>
        <Link
          href={node.href as Route}
          onClick={closeSidebarOnMobile}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1"
        >
          {node.kind === "DATABASE" && !node.icon ? (
            <Database className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
          ) : (
            <PageIcon icon={node.icon} />
          )}
          <span className="truncate">{node.title || "Untitled"}</span>
        </Link>
        <span className="hidden items-center gap-0.5 group-hover:flex group-focus-within:flex">
          {handlers.renderMenu?.(
            node,
            <button type="button" aria-label="Page actions" className="flex size-5 items-center justify-center rounded-sm hover:bg-bg-active">
              <MoreHorizontal className="size-3.5" />
            </button>,
          )}
          {handlers.onAddChild && canExpand && (
            <button
              type="button"
              aria-label="Add a page inside"
              onClick={() => {
                handlers.onAddChild!(node.id);
                if (!isOpen) toggle(node.id);
              }}
              className="flex size-5 items-center justify-center rounded-sm hover:bg-bg-active"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </span>
      </div>
      {canExpand && isOpen && (
        <ul role="group">
          {node.children.length === 0 ? (
            <li className="py-1 text-xs text-fg-subtle" style={{ paddingLeft: 30 + depth * 12 }}>
              No pages inside
            </li>
          ) : (
            node.children.map((c) => <Row key={c.id} node={c} depth={depth + 1} open={open} toggle={toggle} handlers={handlers} />)
          )}
        </ul>
      )}
    </li>
  );
}
