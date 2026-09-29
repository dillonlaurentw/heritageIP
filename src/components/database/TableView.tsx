"use client";

import { Maximize2, MoreHorizontal, Plus, Trash2, Type } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { Popover } from "@/components/ui/Popover";
import { PageIcon } from "@/components/ui/PageIcon";
import { PROPERTY_TYPES, TYPE_LABEL, type Property, type ViewConfig } from "@/lib/db-schema";
import { ValueEditor, type CellCtx } from "./cells";
import { PropertyMenu, TYPE_ICON } from "./PropertyMenu";
import type { DbApi } from "./useDatabase";
import type { ViewRow } from "./DatabaseView";

export function cellCtx(api: DbApi, rowId: string, prop: Property): CellCtx {
  return {
    names: api.data.names,
    people: api.data.people,
    relationTargets: api.data.relationTargets,
    editable: api.data.editable,
    set: (v) => api.setProp(rowId, prop, v),
    addOption: api.addOption,
  };
}

/** Title that edits in place, with an "Open" button to the row's page. */
export function TitleCell({ api, row, autoFocus = false }: { api: DbApi; row: ViewRow; autoFocus?: boolean }) {
  const [editing, setEditing] = useState(autoFocus);
  if (editing && api.data.editable) {
    return (
      <input
        autoFocus
        defaultValue={row.title}
        placeholder="Untitled"
        className="h-7 w-full rounded-sm bg-bg px-1 text-sm font-medium outline-2 outline-accent"
        onBlur={(e) => {
          setEditing(false);
          if (e.target.value !== row.title) api.setTitle(row.id, e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }
  return (
    <div className="group/title flex min-w-0 items-center gap-1.5">
      {row.icon && <PageIcon icon={row.icon} />}
      <button
        type="button"
        onClick={() => (api.data.editable ? setEditing(true) : undefined)}
        className="min-w-0 flex-1 truncate text-left text-sm font-medium"
      >
        {row.title || <span className="text-fg-subtle">Untitled</span>}
      </button>
      <Link
        href={row.href as Route}
        className="flex h-6 shrink-0 items-center gap-1 rounded-sm border border-border bg-bg px-1.5 text-xs text-fg-muted opacity-0 group-hover/title:opacity-100 hover:text-fg focus:opacity-100"
      >
        <Maximize2 className="size-3" /> Open
      </Link>
    </div>
  );
}

export function TableView({ api, rows, config, onHide, focusRow }: { api: DbApi; rows: ViewRow[]; config: ViewConfig; onHide: (propId: string) => void; focusRow: string | null }) {
  const props = api.data.schema.properties.filter((p) => !config.hidden?.includes(p.id));
  const { editable } = api.data;
  const cols = `minmax(16rem,2fr) ${props.map((p) => (p.type === "checkbox" ? "5rem" : p.type === "text" ? "minmax(12rem,1.5fr)" : "minmax(9rem,1fr)")).join(" ")} 2.5rem`;

  return (
    <div className="scroll-quiet overflow-x-auto">
      <div className="min-w-max">
        <div role="row" className="grid border-y border-border text-xs text-fg-muted" style={{ gridTemplateColumns: cols }}>
          <div className="flex h-8 items-center gap-1.5 px-2">
            <Type className="size-3.5" /> Name
          </div>
          {props.map((p) => {
            const Icon = TYPE_ICON[p.type];
            return (
              <PropertyMenu
                key={p.id}
                api={api}
                prop={p}
                onHide={() => onHide(p.id)}
                trigger={
                  <button type="button" className="flex h-8 items-center gap-1.5 border-l border-border px-2 text-left hover:bg-bg-hover">
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                }
              />
            );
          })}
          <div className="flex h-8 items-center justify-center border-l border-border">
            {editable && (
              <Popover
                align="end"
                className="w-48 p-1"
                trigger={
                  <button type="button" aria-label="Add a property" className="flex size-6 items-center justify-center rounded-md hover:bg-bg-hover">
                    <Plus className="size-3.5" />
                  </button>
                }
              >
                {PROPERTY_TYPES.map((t) => {
                  const Icon = TYPE_ICON[t];
                  return (
                    <button key={t} type="button" onClick={() => void api.addProperty(t)} className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-bg-hover">
                      <Icon className="size-3.5 text-fg-subtle" /> {TYPE_LABEL[t]}
                    </button>
                  );
                })}
              </Popover>
            )}
          </div>
        </div>

        {rows.map((r) => (
          <div key={r.id} role="row" className="group grid border-b border-border hover:bg-bg-hover/50" style={{ gridTemplateColumns: cols }}>
            <div className="flex min-h-9 items-center px-2">
              <TitleCell api={api} row={r} autoFocus={focusRow === r.id} />
            </div>
            {props.map((p) => (
              <div key={p.id} className="group/cell flex min-h-9 min-w-0 items-center border-l border-border px-2">
                <ValueEditor prop={p} value={r.props[p.id]} ctx={cellCtx(api, r.id, p)} />
              </div>
            ))}
            <div className="flex items-center justify-center border-l border-border">
              {editable && (
                <Menu
                  align="end"
                  trigger={
                    <button type="button" aria-label="Row actions" className="flex size-6 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-bg-active focus:opacity-100">
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  }
                >
                  <MenuItem icon={<Maximize2 />} render={<Link href={r.href as Route} />}>
                    Open as page
                  </MenuItem>
                  <MenuItem icon={<Trash2 />} danger onClick={() => api.deleteRow(r.id)}>
                    Delete
                  </MenuItem>
                </Menu>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
