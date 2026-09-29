"use client";

import { Calendar, Columns3, List, Pencil, Plus, Table2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/cn";
import { applyView, type ViewType } from "@/lib/db-schema";
import type { DatabaseData } from "@/lib/databases";
import { BoardView, CalendarView, ListView } from "./OtherViews";
import { TableView } from "./TableView";
import { Toolbar } from "./Toolbar";
import { useDatabase } from "./useDatabase";

export type ViewRow = DatabaseData["rows"][number];

const VIEW_ICON: Record<ViewType, typeof Table2> = { TABLE: Table2, BOARD: Columns3, LIST: List, CALENDAR: Calendar };
const VIEW_LABEL: Record<ViewType, string> = { TABLE: "Table", BOARD: "Board", LIST: "List", CALENDAR: "Calendar" };

/**
 * A database: view tabs, toolbar, and the current view. Used full-page and
 * inline (inside another page).
 */
export function DatabaseView({ initial, inline = false }: { initial: DatabaseData; inline?: boolean }) {
  const api = useDatabase(initial);
  const { data } = api;
  const storageKey = `self-view-${data.database.id}`;
  const [viewId, setViewId] = useState(data.views[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [focusRow, setFocusRow] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the last view this browser used
    if (saved && data.views.some((v) => v.id === saved)) setViewId(saved);
  }, [storageKey, data.views]);

  const view = data.views.find((v) => v.id === viewId) ?? data.views[0];
  const rows = useMemo(
    () => (view ? applyView(data.rows, data.schema, view.config, data.me, data.names, search) : []),
    [data.rows, data.schema, view, data.me, data.names, search],
  );

  if (!view) return null;
  const pick = (id: string) => {
    setViewId(id);
    localStorage.setItem(storageKey, id);
  };

  const newRow = async () => {
    const id = await api.addRow({});
    if (id && view.type === "TABLE") setFocusRow(id);
  };

  return (
    <div className={cn("flex flex-col", inline && "my-2")}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border">
        <div role="tablist" className="-mb-px flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {data.views.map((v) => {
            const Icon = VIEW_ICON[v.type];
            const active = v.id === view.id;
            const tab = (
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => pick(v.id)}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1.5 border-b-2 px-2 text-sm",
                  active ? "border-fg font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                <Icon className="size-3.5" /> {v.name}
              </button>
            );
            if (!active || !data.editable) return <span key={v.id}>{tab}</span>;
            return (
              <Menu key={v.id} trigger={tab} className="w-52">
                <MenuItem
                  icon={<Pencil />}
                  onClick={() => {
                    const name = window.prompt("Rename view", v.name);
                    if (name?.trim()) api.renameView(v.id, name.trim());
                  }}
                >
                  Rename
                </MenuItem>
                {data.views.length > 1 && (
                  <>
                    <MenuSeparator />
                    <MenuItem
                      icon={<Trash2 />}
                      danger
                      onClick={() => {
                        api.deleteView(v.id);
                        pick(data.views.find((x) => x.id !== v.id)!.id);
                      }}
                    >
                      Delete view
                    </MenuItem>
                  </>
                )}
              </Menu>
            );
          })}
          {data.editable && (
            <Popover
              className="w-44 p-1"
              trigger={
                <button type="button" aria-label="Add a view" className="flex size-7 shrink-0 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-hover hover:text-fg">
                  <Plus className="size-3.5" />
                </button>
              }
            >
              {(Object.keys(VIEW_LABEL) as ViewType[]).map((t) => {
                const Icon = VIEW_ICON[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={async () => {
                      const id = await api.addView(t);
                      if (id) pick(id);
                    }}
                    className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-bg-hover"
                  >
                    <Icon className="size-3.5 text-fg-subtle" /> {VIEW_LABEL[t]}
                  </button>
                );
              })}
            </Popover>
          )}
        </div>
        <div className="pb-1">
          <Toolbar api={api} view={view} search={search} onSearch={setSearch} onNew={() => void newRow()} />
        </div>
      </div>

      <div className="pt-2">
        {view.type === "TABLE" && (
          <TableView
            api={api}
            rows={rows}
            config={view.config}
            focusRow={focusRow}
            onHide={(propId) => api.setViewConfig(view.id, { ...view.config, hidden: [...(view.config.hidden ?? []), propId] })}
          />
        )}
        {view.type === "BOARD" && <BoardView api={api} rows={rows} config={view.config} />}
        {view.type === "LIST" && <ListView api={api} rows={rows} config={view.config} />}
        {view.type === "CALENDAR" && <CalendarView api={api} rows={rows} config={view.config} />}
      </div>

      {view.type !== "CALENDAR" && view.type !== "BOARD" && (
        <div className="flex items-center justify-between py-1">
          {data.editable ? (
            <button type="button" onClick={() => void newRow()} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-fg-subtle hover:bg-bg-hover hover:text-fg">
              <Plus className="size-3.5" /> New
            </button>
          ) : (
            <span />
          )}
          <span className="text-xs text-fg-subtle">
            {rows.length === data.rows.length ? `${rows.length} ${rows.length === 1 ? "row" : "rows"}` : `${rows.length} of ${data.rows.length}`}
          </span>
        </div>
      )}
    </div>
  );
}
