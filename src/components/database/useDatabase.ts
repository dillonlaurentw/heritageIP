"use client";

import { useCallback, useState } from "react";
import {
  addPropertyAction,
  addRowAction,
  addViewAction,
  deletePropertyAction,
  deleteRowAction,
  deleteViewAction,
  loadDatabaseAction,
  setRowPropAction,
  setRowTitleAction,
  updatePropertyAction,
  updateViewAction,
} from "@/app/actions/databases";
import { useToast } from "@/components/ui/Toast";
import { normalizeValue, type Property, type PropertyType, type Value, type ViewConfig, type ViewType } from "@/lib/db-schema";
import type { DatabaseData } from "@/lib/databases";
import { makeOption } from "./cells";

/**
 * Client state for one database. Edits update the screen at once and save in
 * the background; if a save fails, we reload the truth from the server.
 */
export function useDatabase(initial: DatabaseData) {
  const [data, setData] = useState(initial);
  const toast = useToast();
  const dbId = data.database.id;

  const reload = useCallback(async () => {
    const res = await loadDatabaseAction(dbId);
    if (res.ok) setData(res.data);
  }, [dbId]);

  const guard = useCallback(
    async <T extends { ok: boolean; message?: string }>(p: Promise<T>, reloadAfter = false): Promise<T> => {
      const res = await p;
      if (!res.ok) {
        toast(res.message ?? "Couldn't save that.", "danger");
        await reload();
      } else if (reloadAfter) await reload();
      return res;
    },
    [reload, toast],
  );

  const setProp = (rowId: string, prop: Property, value: Value) => {
    const v = normalizeValue(prop, value);
    setData((d) => ({ ...d, rows: d.rows.map((r) => (r.id === rowId ? { ...r, props: { ...r.props, [prop.id]: v } } : r)) }));
    void guard(setRowPropAction(rowId, prop.id, v));
  };

  const setTitle = (rowId: string, title: string) => {
    setData((d) => ({ ...d, rows: d.rows.map((r) => (r.id === rowId ? { ...r, title } : r)) }));
    void guard(setRowTitleAction(rowId, title));
  };

  const addRow = async (init: { title?: string; props?: Record<string, unknown> } = {}) => {
    const res = await addRowAction(dbId, init);
    if (!res.ok) {
      toast(res.message, "danger");
      return null;
    }
    await reload();
    return res.rowId;
  };

  const deleteRow = (rowId: string) => {
    setData((d) => ({ ...d, rows: d.rows.filter((r) => r.id !== rowId) }));
    void guard(deleteRowAction(rowId));
  };

  const addProperty = async (type: PropertyType, name?: string) => {
    const res = await guard(addPropertyAction(dbId, type, name), true);
    return res.ok ? res.propId : null;
  };

  const updateProperty = (propId: string, patch: Partial<Pick<Property, "name" | "options" | "relation">>) => {
    setData((d) => ({
      ...d,
      schema: { properties: d.schema.properties.map((p) => (p.id === propId ? { ...p, ...patch } : p)) },
    }));
    void guard(updatePropertyAction(dbId, propId, patch), Boolean(patch.relation));
  };

  const deleteProperty = (propId: string) => void guard(deletePropertyAction(dbId, propId), true);

  /** Add an option to a select/status/multi-select property from a picker. */
  const addOption = async (prop: Property, name: string) => {
    const opt = makeOption(name, prop.type === "status" ? "todo" : undefined);
    const options = [...(prop.options ?? []), opt];
    setData((d) => ({ ...d, schema: { properties: d.schema.properties.map((p) => (p.id === prop.id ? { ...p, options } : p)) } }));
    const res = await guard(updatePropertyAction(dbId, prop.id, { options }));
    return res.ok ? opt.id : null;
  };

  const setViewConfig = (viewId: string, config: ViewConfig) => {
    setData((d) => ({ ...d, views: d.views.map((v) => (v.id === viewId ? { ...v, config } : v)) }));
    if (data.editable) void guard(updateViewAction(viewId, { config }));
  };

  const renameView = (viewId: string, name: string) => {
    setData((d) => ({ ...d, views: d.views.map((v) => (v.id === viewId ? { ...v, name } : v)) }));
    void guard(updateViewAction(viewId, { name }));
  };

  const addView = async (type: ViewType) => {
    const res = await guard(addViewAction(dbId, type), true);
    return res.ok ? res.viewId : null;
  };

  const deleteView = (viewId: string) => void guard(deleteViewAction(viewId), true);

  return {
    data,
    reload,
    setProp,
    setTitle,
    addRow,
    deleteRow,
    addProperty,
    updateProperty,
    deleteProperty,
    addOption,
    setViewConfig,
    renameView,
    addView,
    deleteView,
  };
}

export type DbApi = ReturnType<typeof useDatabase>;
