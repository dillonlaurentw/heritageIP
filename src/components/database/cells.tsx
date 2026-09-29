"use client";

import { Check, ExternalLink, Plus, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState, type ReactElement } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Popover } from "@/components/ui/Popover";
import { colorFor, Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { isEmpty, newId, optionOf, type Option, type Property, type Value } from "@/lib/db-schema";
import { formatDate } from "@/lib/time";

export type CellCtx = {
  names: Record<string, string>;
  people: { id: string; name: string }[];
  relationTargets: Record<string, { title: string; rows: { id: string; title: string; href: string }[] }>;
  editable: boolean;
  /** Save a value. */
  set: (value: Value) => void;
  /** Add an option to a select-like property; returns the new option id. */
  addOption?: (prop: Property, name: string) => Promise<string | null>;
};

/** Read-only rendering of a value, compact enough for a table cell or card. */
export function ValueView({ prop, value, names, wrap = false }: { prop: Property; value: Value | undefined; names: Record<string, string>; wrap?: boolean }) {
  if (prop.type === "checkbox") {
    return (
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-sm border",
          value ? "border-accent bg-accent text-accent-fg" : "border-border-strong",
        )}
      >
        {value && <Check className="size-3" />}
      </span>
    );
  }
  if (isEmpty(value)) return null;
  switch (prop.type) {
    case "select":
    case "status": {
      const o = optionOf(prop, value);
      return o ? <Tag color={o.color}>{prop.type === "status" && <StatusDot group={o.group} />}{o.name}</Tag> : null;
    }
    case "multiSelect":
      return (
        <span className={cn("flex gap-1", wrap ? "flex-wrap" : "overflow-hidden")}>
          {(value as string[]).map((id) => {
            const o = optionOf(prop, id);
            return o ? (
              <Tag key={id} color={o.color}>
                {o.name}
              </Tag>
            ) : null;
          })}
        </span>
      );
    case "person":
      return (
        <span className={cn("flex items-center gap-2", wrap ? "flex-wrap" : "overflow-hidden")}>
          {(value as string[]).map((id) => (
            <span key={id} className="flex shrink-0 items-center gap-1.5 text-sm">
              <Avatar name={names[id] ?? "?"} size="sm" />
              {names[id]?.split(" ")[0] ?? "Former member"}
            </span>
          ))}
        </span>
      );
    case "relation":
      return (
        <span className={cn("flex gap-1", wrap ? "flex-wrap" : "overflow-hidden")}>
          {(value as string[]).map((id) => (
            <span key={id} className="max-w-40 shrink-0 truncate rounded-sm bg-bg-inset px-1.5 text-xs leading-5 underline decoration-border underline-offset-2">
              {names[id] ?? "Removed"}
            </span>
          ))}
        </span>
      );
    case "date":
      return <span className="text-sm whitespace-nowrap">{formatDate(`${value}T00:00:00Z`, new Date(`${value}T00:00:00Z`).getUTCFullYear() !== new Date().getUTCFullYear())}</span>;
    case "url":
      return (
        <a href={String(value)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="truncate text-sm text-accent-text underline underline-offset-2">
          {String(value).replace(/^https?:\/\//, "")}
        </a>
      );
    case "number":
      return <span className="text-sm tabular-nums">{String(value)}</span>;
    default:
      return <span className={cn("text-sm", !wrap && "truncate")}>{String(value)}</span>;
  }
}

function StatusDot({ group }: { group?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mr-1 inline-block size-2 shrink-0 rounded-full border align-[0.5px]",
        group === "done" ? "border-current bg-current" : group === "doing" ? "border-current bg-current/40" : "border-current",
      )}
    />
  );
}

/**
 * A value you can edit. Text-like values edit inline; everything else opens
 * a small picker. `trigger` is what shows while not editing.
 */
export function ValueEditor({ prop, value, ctx, className }: { prop: Property; value: Value | undefined; ctx: CellCtx; className?: string }) {
  const [editing, setEditing] = useState(false);
  const display = (
    <span className={cn("flex min-h-7 w-full min-w-0 items-center", className)}>
      <ValueView prop={prop} value={value} names={ctx.names} />
      {isEmpty(value) && prop.type !== "checkbox" && ctx.editable && <span className="text-sm text-fg-subtle opacity-0 group-hover/cell:opacity-100">Empty</span>}
    </span>
  );
  if (!ctx.editable) return display;

  if (prop.type === "checkbox") {
    return (
      <button type="button" aria-label={prop.name} className={cn("flex min-h-7 items-center", className)} onClick={() => ctx.set(!value)}>
        <ValueView prop={prop} value={value} names={ctx.names} />
      </button>
    );
  }

  if (prop.type === "text" || prop.type === "number" || prop.type === "url") {
    if (!editing) {
      return (
        <button type="button" onClick={() => setEditing(true)} className="flex w-full min-w-0 text-left">
          {display}
        </button>
      );
    }
    return (
      <input
        autoFocus
        type={prop.type === "number" ? "number" : prop.type === "url" ? "url" : "text"}
        defaultValue={value == null ? "" : String(value)}
        placeholder={prop.type === "url" ? "https://" : ""}
        className="h-7 w-full rounded-sm bg-bg px-1 text-sm outline-2 outline-accent"
        onBlur={(e) => {
          setEditing(false);
          const v = e.target.value;
          if (v !== (value == null ? "" : String(value))) ctx.set(prop.type === "number" ? (v === "" ? null : Number(v)) : v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <Picker prop={prop} value={value} ctx={ctx} trigger={<button type="button" className="flex w-full min-w-0 text-left">{display}</button>} />
  );
}

/** The popover for select, status, multi-select, person, date and relation values. */
export function Picker({ prop, value, ctx, trigger }: { prop: Property; value: Value | undefined; ctx: CellCtx; trigger: ReactElement }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const multi = prop.type === "multiSelect" || prop.type === "person" || prop.type === "relation";
  const selected = new Set(Array.isArray(value) ? value : value ? [String(value)] : []);

  const toggle = (id: string) => {
    if (multi) {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      ctx.set([...next]);
    } else {
      ctx.set(selected.has(id) ? null : id);
      setOpen(false);
    }
  };

  let items: { id: string; label: string; node: ReactElement }[] = [];
  if (prop.options) {
    items = prop.options.map((o: Option) => ({ id: o.id, label: o.name, node: <Tag color={o.color}>{o.name}</Tag> }));
  } else if (prop.type === "person") {
    items = ctx.people.map((p) => ({
      id: p.id,
      label: p.name,
      node: (
        <span className="flex items-center gap-2 text-sm">
          <Avatar name={p.name} size="sm" /> {p.name}
        </span>
      ),
    }));
  } else if (prop.type === "relation") {
    const target = prop.relation?.databaseId ? ctx.relationTargets[prop.relation.databaseId] : undefined;
    items = (target?.rows ?? []).map((r) => ({
      id: r.id,
      label: r.title,
      node: (
        <span className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="truncate">{r.title}</span>
          <Link href={r.href as Route} onClick={(e) => e.stopPropagation()} className="text-fg-subtle hover:text-fg" aria-label="Open">
            <ExternalLink className="size-3" />
          </Link>
        </span>
      ),
    }));
  }
  const filtered = items.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase()));
  const canCreate = Boolean(prop.options && ctx.addOption && q.trim() && !items.some((i) => i.label.toLowerCase() === q.trim().toLowerCase()));

  return (
    <Popover trigger={trigger} open={open} onOpenChange={setOpen} className="w-64 p-1">
      {prop.type === "date" ? (
        <div className="flex flex-col gap-2 p-1">
          <Input type="date" defaultValue={typeof value === "string" ? value : ""} onChange={(e) => ctx.set(e.target.value || null)} />
          {value && (
            <button type="button" onClick={() => { ctx.set(null); setOpen(false); }} className="h-7 rounded-md text-sm text-fg-muted hover:bg-bg-hover">
              Clear date
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && canCreate) {
                e.preventDefault();
                const newOpt = await ctx.addOption!(prop, q.trim());
                if (newOpt) toggle(newOpt);
                setQ("");
              }
            }}
            placeholder={prop.options ? "Search or create…" : prop.type === "relation" && !prop.relation?.databaseId ? "Link this property to a database first" : "Search…"}
            className="mb-1 h-8 w-full rounded-md bg-bg-inset px-2 text-sm outline-none"
          />
          <div className="scroll-quiet max-h-64 overflow-y-auto">
            {filtered.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => toggle(i.id)}
                className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-bg-hover"
              >
                <span className="min-w-0 flex-1 truncate">{i.node}</span>
                {selected.has(i.id) && <Check className="size-3.5 shrink-0 text-accent-text" />}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                onClick={async () => {
                  const newOpt = await ctx.addOption!(prop, q.trim());
                  if (newOpt) toggle(newOpt);
                  setQ("");
                }}
                className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-bg-hover"
              >
                <Plus className="size-3.5" /> Create <Tag color={colorFor(q)}>{q.trim()}</Tag>
              </button>
            )}
            {filtered.length === 0 && !canCreate && <p className="px-2 py-3 text-center text-xs text-fg-subtle">Nothing here.</p>}
          </div>
          {selected.size > 0 && multi && (
            <button type="button" onClick={() => ctx.set([])} className="mt-1 flex h-7 w-full items-center justify-center gap-1 rounded-md text-xs text-fg-muted hover:bg-bg-hover">
              <X className="size-3" /> Clear
            </button>
          )}
        </>
      )}
    </Popover>
  );
}

/** A new option with a stable id and a color picked from its name. */
export function makeOption(name: string, group?: Option["group"]): Option {
  return { id: newId("o"), name, color: colorFor(name), ...(group ? { group } : {}) };
}
