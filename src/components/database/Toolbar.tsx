"use client";

import { ArrowDownUp, Eye, EyeOff, Filter as FilterIcon, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/cn";
import { PROPERTY_TYPES, TITLE, TYPE_LABEL, type Filter, type FilterOp, type Property, type ViewConfig, type ViewType } from "@/lib/db-schema";
import type { DbApi } from "./useDatabase";

const selectCls = "h-7 rounded-md border border-border bg-bg px-1.5 text-sm outline-none focus:border-accent";

/** Which filter operators make sense for each property type. */
function opsFor(prop: Property | "title"): { op: FilterOp; label: string; needsValue?: "text" | "option" | "date" }[] {
  if (prop === "title") return [
    { op: "contains", label: "contains", needsValue: "text" },
    { op: "empty", label: "is empty" },
    { op: "not_empty", label: "is not empty" },
  ];
  switch (prop.type) {
    case "status":
      return [
        { op: "is", label: "is", needsValue: "option" },
        { op: "is_not", label: "is not", needsValue: "option" },
        { op: "done", label: "is done" },
        { op: "not_done", label: "is not done" },
      ];
    case "select":
    case "multiSelect":
      return [
        { op: "is", label: prop.type === "multiSelect" ? "has" : "is", needsValue: "option" },
        { op: "is_not", label: prop.type === "multiSelect" ? "doesn't have" : "is not", needsValue: "option" },
        { op: "empty", label: "is empty" },
        { op: "not_empty", label: "is not empty" },
      ];
    case "person":
      return [
        { op: "me", label: "includes me" },
        { op: "empty", label: "is empty" },
        { op: "not_empty", label: "is not empty" },
      ];
    case "checkbox":
      return [
        { op: "checked", label: "is checked" },
        { op: "unchecked", label: "is unchecked" },
      ];
    case "date":
      return [
        { op: "before", label: "is before", needsValue: "date" },
        { op: "after", label: "is after", needsValue: "date" },
        { op: "empty", label: "is empty" },
        { op: "not_empty", label: "is not empty" },
      ];
    default:
      return [
        { op: "contains", label: "contains", needsValue: "text" },
        { op: "empty", label: "is empty" },
        { op: "not_empty", label: "is not empty" },
      ];
  }
}

export function Toolbar({
  api,
  view,
  search,
  onSearch,
  onNew,
}: {
  api: DbApi;
  view: { id: string; type: ViewType; config: ViewConfig };
  search: string;
  onSearch: (q: string) => void;
  onNew?: () => void;
}) {
  const { schema, editable } = api.data;
  const props = schema.properties;
  const cfg = view.config;
  const set = (patch: Partial<ViewConfig>) => api.setViewConfig(view.id, { ...cfg, ...patch });
  const [searching, setSearching] = useState(Boolean(search));
  const propOf = (id: string) => (id === TITLE ? "title" : props.find((p) => p.id === id)) ?? null;
  const nameOf = (id: string) => (id === TITLE ? "Name" : id === "created" ? "Created" : id === "updated" ? "Updated" : props.find((p) => p.id === id)?.name ?? "Deleted");

  const filterRow = (f: Filter, i: number) => {
    const prop = propOf(f.propId);
    const ops = prop ? opsFor(prop) : [];
    const cur = ops.find((o) => o.op === f.op);
    const update = (patch: Partial<Filter>) => set({ filters: cfg.filters.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
    return (
      <div key={i} className="flex flex-wrap items-center gap-1.5">
        <select
          className={selectCls}
          value={f.propId}
          onChange={(e) => {
            const np = propOf(e.target.value);
            update({ propId: e.target.value, op: np ? opsFor(np)[0].op : "contains", value: null });
          }}
        >
          <option value={TITLE}>Name</option>
          {props.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className={selectCls} value={f.op} onChange={(e) => update({ op: e.target.value as FilterOp })}>
          {ops.map((o) => (
            <option key={o.op} value={o.op}>
              {o.label}
            </option>
          ))}
        </select>
        {cur?.needsValue === "option" && prop && prop !== "title" && (
          <select className={selectCls} value={String(f.value ?? "")} onChange={(e) => update({ value: e.target.value })}>
            <option value="">Choose…</option>
            {prop.options?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
        {cur?.needsValue === "text" && (
          <input className={cn(selectCls, "w-32")} value={String(f.value ?? "")} onChange={(e) => update({ value: e.target.value })} placeholder="Value" />
        )}
        {cur?.needsValue === "date" && (
          <input type="date" className={selectCls} value={String(f.value ?? "")} onChange={(e) => update({ value: e.target.value })} />
        )}
        <button type="button" aria-label="Remove filter" onClick={() => set({ filters: cfg.filters.filter((_, j) => j !== i) })} className="flex size-6 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-hover">
          <X className="size-3.5" />
        </button>
      </div>
    );
  };

  const badge = (n: number) => (n > 0 ? <span className="rounded-sm bg-accent-soft px-1 text-2xs font-semibold text-accent-text">{n}</span> : null);

  return (
    <div className="flex flex-wrap items-center justify-end gap-0.5">
      {searching ? (
        <div className="flex h-7 items-center gap-1 rounded-md border border-border px-2">
          <Search className="size-3.5 text-fg-subtle" />
          <input
            autoFocus
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            onBlur={() => !search && setSearching(false)}
            placeholder="Search"
            className="w-28 bg-transparent text-sm outline-none"
          />
        </div>
      ) : (
        <Button variant="ghost" iconOnly aria-label="Search" onClick={() => setSearching(true)}>
          <Search className="size-4" />
        </Button>
      )}

      <Popover
        align="end"
        className="w-[26rem]"
        trigger={
          <Button variant="ghost" size="sm">
            <FilterIcon className="size-3.5" /> Filter {badge(cfg.filters.length)}
          </Button>
        }
      >
        <div className="flex flex-col gap-2 p-1">
          {cfg.filters.length === 0 && <p className="text-sm text-fg-muted">No filters. Showing everything.</p>}
          {cfg.filters.map(filterRow)}
          <button
            type="button"
            onClick={() => set({ filters: [...cfg.filters, { propId: TITLE, op: "contains", value: "" }] })}
            className="flex h-7 items-center gap-1.5 self-start rounded-md px-1.5 text-sm text-fg-muted hover:bg-bg-hover"
          >
            <Plus className="size-3.5" /> Add a filter
          </button>
        </div>
      </Popover>

      <Popover
        align="end"
        className="w-80"
        trigger={
          <Button variant="ghost" size="sm">
            <ArrowDownUp className="size-3.5" /> Sort {badge(cfg.sorts.length)}
          </Button>
        }
      >
        <div className="flex flex-col gap-2 p-1">
          {cfg.sorts.length === 0 && <p className="text-sm text-fg-muted">No sort. Rows keep their order.</p>}
          {cfg.sorts.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                className={cn(selectCls, "flex-1")}
                value={s.propId}
                onChange={(e) => set({ sorts: cfg.sorts.map((x, j) => (j === i ? { ...x, propId: e.target.value } : x)) })}
              >
                {[TITLE, ...props.map((p) => p.id), "created", "updated"].map((id) => (
                  <option key={id} value={id}>
                    {nameOf(id)}
                  </option>
                ))}
              </select>
              <select
                className={selectCls}
                value={s.dir}
                onChange={(e) => set({ sorts: cfg.sorts.map((x, j) => (j === i ? { ...x, dir: e.target.value as "asc" | "desc" } : x)) })}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button type="button" aria-label="Remove sort" onClick={() => set({ sorts: cfg.sorts.filter((_, j) => j !== i) })} className="flex size-6 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-hover">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {cfg.sorts.length < 5 && (
            <button
              type="button"
              onClick={() => set({ sorts: [...cfg.sorts, { propId: TITLE, dir: "asc" }] })}
              className="flex h-7 items-center gap-1.5 self-start rounded-md px-1.5 text-sm text-fg-muted hover:bg-bg-hover"
            >
              <Plus className="size-3.5" /> Add a sort
            </button>
          )}
        </div>
      </Popover>

      <Popover
        align="end"
        className="w-72"
        trigger={
          <Button variant="ghost" iconOnly aria-label="View options">
            <SlidersHorizontal className="size-4" />
          </Button>
        }
      >
        <div className="flex flex-col gap-3 p-1">
          {view.type === "BOARD" && (
            <label className="flex items-center justify-between gap-2 text-sm">
              Group by
              <select className={selectCls} value={cfg.groupBy ?? ""} onChange={(e) => set({ groupBy: e.target.value || null })}>
                <option value="">Nothing</option>
                {props
                  .filter((p) => ["select", "status", "multiSelect", "person"].includes(p.type))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {view.type === "CALENDAR" && (
            <label className="flex items-center justify-between gap-2 text-sm">
              Show by date
              <select className={selectCls} value={cfg.dateProp ?? ""} onChange={(e) => set({ dateProp: e.target.value || null })}>
                <option value="">Choose…</option>
                {props
                  .filter((p) => p.type === "date")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <div>
            <p className="mb-1 text-xs font-medium text-fg-subtle">Properties</p>
            {props.map((p) => {
              const hidden = cfg.hidden?.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set({ hidden: hidden ? (cfg.hidden ?? []).filter((h) => h !== p.id) : [...(cfg.hidden ?? []), p.id] })}
                  className="flex h-7 w-full items-center justify-between rounded-md px-1.5 text-sm hover:bg-bg-hover"
                >
                  <span className={cn(hidden && "text-fg-subtle")}>{p.name}</span>
                  {hidden ? <EyeOff className="size-3.5 text-fg-subtle" /> : <Eye className="size-3.5 text-fg-muted" />}
                </button>
              );
            })}
          </div>
          {editable && (
            <div>
              <p className="mb-1 text-xs font-medium text-fg-subtle">Add a property</p>
              <div className="grid grid-cols-2 gap-0.5">
                {PROPERTY_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => void api.addProperty(t)} className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-left text-sm hover:bg-bg-hover">
                    <Plus className="size-3 text-fg-subtle" /> {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Popover>

      {editable && onNew && (
        <Button variant="primary" size="sm" onClick={onNew} className="ml-1">
          <Plus className="size-3.5" /> New
        </Button>
      )}
    </div>
  );
}
