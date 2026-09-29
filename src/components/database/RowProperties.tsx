"use client";

import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { DatabaseData } from "@/lib/databases";
import { NEEDS, needHref, type Need } from "@/lib/needs";
import { ValueEditor } from "./cells";
import { TYPE_ICON } from "./PropertyMenu";
import { cellCtx } from "./TableView";
import { useDatabase } from "./useDatabase";

/** A row's properties, shown under its title on the row's own page. */
export function RowProperties({ initial, rowId }: { initial: DatabaseData; rowId: string }) {
  const api = useDatabase(initial);
  const row = api.data.rows.find((r) => r.id === rowId);
  if (!row) return null;
  const isPlan = api.data.database.systemKey === "gamePlan";
  const needs = isPlan && Array.isArray(row.props.needs) ? (row.props.needs as string[]).filter((n): n is Need => n in NEEDS) : [];

  return (
    <div className="mt-2 mb-4 flex flex-col gap-0.5 border-b border-border pb-4">
      {api.data.schema.properties.map((p) => {
        const Icon = TYPE_ICON[p.type];
        return (
          <div key={p.id} className="group/cell grid grid-cols-[10rem_1fr] items-start gap-2">
            <span className="flex h-8 items-center gap-2 text-sm text-fg-muted">
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{p.name}</span>
            </span>
            <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-2 rounded-md px-1.5 hover:bg-bg-hover">
              <ValueEditor prop={p} value={row.props[p.id]} ctx={cellCtx(api, row.id, p)} className="flex-1" />
            </div>
          </div>
        );
      })}

      {needs.length > 0 && (
        <div className="mt-3 rounded-lg bg-bg-subtle p-3">
          <p className="mb-2 text-xs font-medium text-fg-subtle">Find who this step needs</p>
          <div className="flex flex-col gap-1">
            {needs.map((n) => (
              <Link
                key={n}
                href={needHref(n, api.data.database.workspaceSlug, row.id) as Route}
                className="group flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-bg-hover"
              >
                <span className="font-medium">{NEEDS[n].label}</span>
                <span className="min-w-0 flex-1 truncate text-fg-muted">{NEEDS[n].line}</span>
                <ArrowUpRight className="size-3.5 text-fg-subtle group-hover:text-fg" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-fg-subtle">
        In{" "}
        <Link href={`/w/${api.data.database.workspaceSlug}/${api.data.database.id}` as Route} className="underline underline-offset-2 hover:text-fg">
          {api.data.database.title || "Untitled database"}
        </Link>
      </p>
    </div>
  );
}
