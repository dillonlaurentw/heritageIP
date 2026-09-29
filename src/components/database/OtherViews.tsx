"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageIcon } from "@/components/ui/PageIcon";
import { Tag } from "@/components/ui/Tag";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/cn";
import { groupRows, isEmpty, valueForGroup, type Property, type ViewConfig } from "@/lib/db-schema";
import { ValueView } from "./cells";
import type { ViewRow } from "./DatabaseView";
import type { DbApi } from "./useDatabase";

/** Properties shown on cards and list rows: visible, non-empty, not the grouping one. */
function cardProps(api: DbApi, config: ViewConfig, except?: string | null) {
  return api.data.schema.properties.filter((p) => !config.hidden?.includes(p.id) && p.id !== except && p.type !== "relation");
}

function Card({ api, row, props, draggable, onDragStart }: { api: DbApi; row: ViewRow; props: Property[]; draggable: boolean; onDragStart?: (e: React.DragEvent) => void }) {
  const shown = props.filter((p) => !isEmpty(row.props[p.id]));
  return (
    <Link
      href={row.href as Route}
      draggable={draggable}
      onDragStart={onDragStart}
      className="flex flex-col gap-1.5 rounded-md border border-border bg-bg p-2.5 shadow-[0_1px_0_var(--border)] transition-colors hover:border-border-strong hover:bg-bg-hover"
    >
      <span className="flex items-start gap-1.5 text-sm font-medium">
        {row.icon && <PageIcon icon={row.icon} />}
        <span className="min-w-0 break-words">{row.title || <span className="text-fg-subtle">Untitled</span>}</span>
      </span>
      {api.data.rollups[row.id] && <Progress {...api.data.rollups[row.id]} />}
      {shown.map((p) => (
        <span key={p.id} className="min-w-0">
          <ValueView prop={p} value={row.props[p.id]} names={api.data.names} wrap />
        </span>
      ))}
    </Link>
  );
}

export function BoardView({ api, rows, config }: { api: DbApi; rows: ViewRow[]; config: ViewConfig }) {
  const prop = api.data.schema.properties.find((p) => p.id === config.groupBy);
  const groups = groupRows(rows, prop, api.data.names);
  const [over, setOver] = useState<string | null>(null);
  const shown = cardProps(api, config, prop?.id);
  const { editable } = api.data;

  if (!prop) {
    return <p className="py-8 text-center text-sm text-fg-muted">Choose a property to group by in view options.</p>;
  }

  return (
    <div className="scroll-quiet flex gap-3 overflow-x-auto pb-4">
      {groups.map((g) => (
        <div
          key={g.key || "none"}
          onDragOver={(e) => {
            if (!editable) return;
            e.preventDefault();
            setOver(g.key);
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            setOver(null);
            const [rowId, from] = e.dataTransfer.getData("text/self-row").split("|");
            if (!rowId || from === g.key) return;
            const row = rows.find((r) => r.id === rowId);
            api.setProp(rowId, prop, valueForGroup(prop, row?.props[prop.id], from, g.key));
          }}
          className={cn("flex w-64 shrink-0 flex-col gap-2 rounded-lg p-1.5 transition-colors", over === g.key ? "bg-accent-soft" : "bg-bg-subtle")}
        >
          <div className="flex items-center justify-between px-1 pt-0.5">
            <Tag color={g.color}>{g.label}</Tag>
            <span className="text-xs text-fg-subtle">{g.rows.length}</span>
          </div>
          {g.rows.map((r) => (
            <Card
              key={r.id}
              api={api}
              row={r}
              props={shown}
              draggable={editable}
              onDragStart={(e) => e.dataTransfer.setData("text/self-row", `${r.id}|${g.key}`)}
            />
          ))}
          {editable && (
            <button
              type="button"
              onClick={() => void api.addRow({ props: g.key ? { [prop.id]: prop.type === "multiSelect" || prop.type === "person" ? [g.key] : g.key } : {} })}
              className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-sm text-fg-subtle hover:bg-bg-hover hover:text-fg"
            >
              <Plus className="size-3.5" /> New
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function ListView({ api, rows, config }: { api: DbApi; rows: ViewRow[]; config: ViewConfig }) {
  const shown = cardProps(api, config);
  if (rows.length === 0) return null;
  return (
    <ul className="divide-y divide-border border-y border-border">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={r.href as Route} className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 hover:bg-bg-hover">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium">
              {r.icon && <PageIcon icon={r.icon} />}
              <span className="truncate">{r.title || <span className="text-fg-subtle">Untitled</span>}</span>
              {api.data.rollups[r.id] && <Progress {...api.data.rollups[r.id]} className="ml-2" />}
            </span>
            {shown
              .filter((p) => !isEmpty(r.props[p.id]))
              .map((p) => (
                <span key={p.id} className="max-w-60 min-w-0">
                  <ValueView prop={p} value={r.props[p.id]} names={api.data.names} />
                </span>
              ))}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function CalendarView({ api, rows, config }: { api: DbApi; rows: ViewRow[]; config: ViewConfig }) {
  const prop = api.data.schema.properties.find((p) => p.id === config.dateProp && p.type === "date");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });
  if (!prop) return <p className="py-8 text-center text-sm text-fg-muted">Choose a date property in view options.</p>;

  const first = new Date(month);
  const offset = (first.getUTCDay() + 6) % 7; // Monday first
  const start = new Date(first);
  start.setUTCDate(1 - offset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d;
  });
  const byDay = new Map<string, ViewRow[]>();
  for (const r of rows) {
    const v = r.props[prop.id];
    if (typeof v === "string") byDay.set(v, [...(byDay.get(v) ?? []), r]);
  }
  const today = iso(new Date());
  const shift = (n: number) => setMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + n, 1)));

  return (
    <div>
      <div className="mb-2 flex items-center gap-1">
        <span className="mr-auto text-base font-semibold">
          {month.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}
        </span>
        <Button variant="ghost" iconOnly aria-label="Previous month" onClick={() => shift(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMonth(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)))}>
          Today
        </Button>
        <Button variant="ghost" iconOnly aria-label="Next month" onClick={() => shift(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 border-t border-l border-border text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="border-r border-b border-border px-2 py-1 text-fg-subtle">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const key = iso(d);
          const inMonth = d.getUTCMonth() === month.getUTCMonth();
          return (
            <div key={key} className={cn("group min-h-24 border-r border-b border-border p-1", !inMonth && "bg-bg-subtle")}>
              <div className="flex items-center justify-between">
                <span className={cn("flex size-5 items-center justify-center rounded-full", key === today ? "bg-primary text-primary-fg" : inMonth ? "text-fg-muted" : "text-fg-subtle")}>
                  {d.getUTCDate()}
                </span>
                {api.data.editable && (
                  <button
                    type="button"
                    aria-label={`New on ${key}`}
                    onClick={() => void api.addRow({ props: { [prop.id]: key } })}
                    className="flex size-5 items-center justify-center rounded-sm text-fg-subtle opacity-0 group-hover:opacity-100 hover:bg-bg-hover"
                  >
                    <Plus className="size-3" />
                  </button>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {(byDay.get(key) ?? []).map((r) => (
                  <Link key={r.id} href={r.href as Route} className="truncate rounded-sm bg-bg-inset px-1.5 py-0.5 text-xs hover:bg-bg-active">
                    {r.title || "Untitled"}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
