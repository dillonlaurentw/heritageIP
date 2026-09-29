"use client";

import {
  Calendar,
  CheckSquare,
  CircleDot,
  EyeOff,
  Hash,
  Link2,
  List,
  Tags,
  Trash2,
  Type,
  UserRound,
  Waypoints,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { listDatabasesAction } from "@/app/actions/databases";
import { Popover } from "@/components/ui/Popover";
import { Tag, TAG_COLORS, type TagColor } from "@/components/ui/Tag";
import { TYPE_LABEL, type Option, type Property, type PropertyType } from "@/lib/db-schema";
import { makeOption } from "./cells";
import type { DbApi } from "./useDatabase";

export const TYPE_ICON: Record<PropertyType, typeof Type> = {
  text: Type,
  number: Hash,
  select: CircleDot,
  multiSelect: Tags,
  status: List,
  person: UserRound,
  date: Calendar,
  checkbox: CheckSquare,
  url: Link2,
  relation: Waypoints,
};

/** Edit one property: name, options and colors, relation target; hide or delete it. */
export function PropertyMenu({ api, prop, trigger, onHide }: { api: DbApi; prop: Property; trigger: ReactElement; onHide?: () => void }) {
  const [name, setName] = useState(prop.name);
  const [newOpt, setNewOpt] = useState("");
  const [dbs, setDbs] = useState<{ id: string; title: string }[] | null>(null);
  const editable = api.data.editable;
  const Icon = TYPE_ICON[prop.type];

  useEffect(() => {
    if (prop.type === "relation" && editable && dbs === null) {
      void listDatabasesAction(api.data.database.workspaceId).then((d) => setDbs(d.filter((x) => x.id !== api.data.database.id)));
    }
  }, [prop.type, editable, dbs, api.data.database.workspaceId, api.data.database.id]);

  const setOptions = (options: Option[]) => api.updateProperty(prop.id, { options });

  return (
    <Popover trigger={trigger} className="w-72 p-2">
      <div className="flex items-center gap-2 pb-2">
        <Icon className="size-4 shrink-0 text-fg-subtle" />
        {editable ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== prop.name && api.updateProperty(prop.id, { name: name.trim() })}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="h-7 flex-1 rounded-md bg-bg-inset px-2 text-sm outline-none"
            aria-label="Property name"
          />
        ) : (
          <span className="text-sm font-medium">{prop.name}</span>
        )}
      </div>
      <p className="px-1 pb-2 text-xs text-fg-subtle">{TYPE_LABEL[prop.type]}</p>

      {prop.options && editable && (
        <div className="border-t border-border pt-2">
          <p className="px-1 pb-1 text-xs font-medium text-fg-subtle">Options</p>
          <div className="scroll-quiet flex max-h-56 flex-col gap-0.5 overflow-y-auto">
            {prop.options.map((o, i) => (
              <div key={o.id} className="group flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-bg-hover">
                <Popover
                  className="w-40 p-1.5"
                  trigger={
                    <button type="button" aria-label="Color" className="size-4 shrink-0 rounded-sm" style={{ background: `var(--tag-${o.color}-bg)`, boxShadow: `inset 0 0 0 1px var(--tag-${o.color}-fg)` }} />
                  }
                >
                  <div className="grid grid-cols-5 gap-1">
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={c}
                        onClick={() => setOptions(prop.options!.map((x, j) => (j === i ? { ...x, color: c as TagColor } : x)))}
                        className="size-5 rounded-sm"
                        style={{ background: `var(--tag-${c}-bg)`, boxShadow: `inset 0 0 0 1px var(--tag-${c}-fg)` }}
                      />
                    ))}
                  </div>
                </Popover>
                <input
                  defaultValue={o.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== o.name) setOptions(prop.options!.map((x, j) => (j === i ? { ...x, name: v } : x)));
                  }}
                  className="h-6 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                {prop.type === "status" && (
                  <select
                    value={o.group ?? "todo"}
                    onChange={(e) => setOptions(prop.options!.map((x, j) => (j === i ? { ...x, group: e.target.value as Option["group"] } : x)))}
                    className="h-6 rounded-sm bg-transparent text-xs text-fg-muted outline-none"
                    aria-label="Counts as"
                  >
                    <option value="todo">To do</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                  </select>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${o.name}`}
                  onClick={() => setOptions(prop.options!.filter((_, j) => j !== i))}
                  className="flex size-5 items-center justify-center rounded-sm text-fg-subtle opacity-0 group-hover:opacity-100 hover:text-fg"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <form
            className="mt-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newOpt.trim()) return;
              setOptions([...prop.options!, makeOption(newOpt.trim(), prop.type === "status" ? "todo" : undefined)]);
              setNewOpt("");
            }}
          >
            <input value={newOpt} onChange={(e) => setNewOpt(e.target.value)} placeholder="Add an option…" className="h-7 w-full rounded-md bg-bg-inset px-2 text-sm outline-none" />
          </form>
        </div>
      )}

      {prop.options && !editable && (
        <div className="flex flex-wrap gap-1 border-t border-border pt-2">
          {prop.options.map((o) => (
            <Tag key={o.id} color={o.color}>
              {o.name}
            </Tag>
          ))}
        </div>
      )}

      {prop.type === "relation" && editable && (
        <div className="border-t border-border pt-2">
          <label className="flex flex-col gap-1 px-1 text-xs font-medium text-fg-subtle">
            Links to
            <select
              value={prop.relation?.databaseId ?? ""}
              onChange={(e) => e.target.value && api.updateProperty(prop.id, { relation: { databaseId: e.target.value } })}
              className="h-7 rounded-md border border-border bg-bg px-1.5 text-sm font-normal text-fg outline-none"
            >
              <option value="">Choose a database…</option>
              {(dbs ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title || "Untitled"}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="mt-2 flex flex-col border-t border-border pt-1">
        {onHide && (
          <button type="button" onClick={onHide} className="flex h-7 items-center gap-2 rounded-md px-1.5 text-sm hover:bg-bg-hover">
            <EyeOff className="size-3.5 text-fg-subtle" /> Hide in this view
          </button>
        )}
        {editable && (
          <button type="button" onClick={() => api.deleteProperty(prop.id)} className="flex h-7 items-center gap-2 rounded-md px-1.5 text-sm text-danger hover:bg-bg-hover">
            <Trash2 className="size-3.5" /> Delete property
          </button>
        )}
      </div>
    </Popover>
  );
}
