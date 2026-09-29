/**
 * Databases: property definitions, row values, and the pure logic behind
 * views (filter, sort, group). Shared by server, client and seed; no I/O.
 *
 * A DATABASE page stores `schema: { properties }`. Each ROW page stores
 * `props: { [propertyId]: value }`. The row's title is the page title.
 */
import { z } from "zod";
import type { TagColor } from "@/components/ui/Tag";

export const PROPERTY_TYPES = [
  "text",
  "number",
  "select",
  "multiSelect",
  "status",
  "person",
  "date",
  "checkbox",
  "url",
  "relation",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const TYPE_LABEL: Record<PropertyType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  multiSelect: "Multi-select",
  status: "Status",
  person: "Person",
  date: "Date",
  checkbox: "Checkbox",
  url: "Link",
  relation: "Relation",
};

export type StatusGroup = "todo" | "doing" | "done";
export type Option = { id: string; name: string; color: TagColor; group?: StatusGroup };

export type Property = {
  id: string;
  name: string;
  type: PropertyType;
  options?: Option[]; // select, multiSelect, status
  relation?: { databaseId: string }; // relation
};

export type DbSchema = { properties: Property[] };

export type ViewType = "TABLE" | "BOARD" | "LIST" | "CALENDAR";
export type FilterOp =
  | "is"
  | "is_not"
  | "contains"
  | "empty"
  | "not_empty"
  | "checked"
  | "unchecked"
  | "me"
  | "before"
  | "after"
  | "done"
  | "not_done";
export type Filter = { propId: string; op: FilterOp; value?: string | number | null };
export type Sort = { propId: string; dir: "asc" | "desc" };
export type ViewConfig = {
  filters: Filter[];
  sorts: Sort[];
  groupBy?: string | null; // board columns
  hidden?: string[]; // properties not shown
  dateProp?: string | null; // calendar
};

export type Value = string | number | boolean | string[] | null;
export type RowLike = {
  id: string;
  title: string;
  props: Record<string, Value>;
  createdAt: string;
  updatedAt: string;
};

export const TITLE = "title";
export const emptyConfig = (): ViewConfig => ({ filters: [], sorts: [], hidden: [] });

let seq = 0;
/** Short ids for properties and options. Stable once stored. */
export const newId = (prefix = "p") => `${prefix}${Date.now().toString(36).slice(-5)}${(seq++ % 1296).toString(36)}`;

// ── Values ─────────────────────────────────────────────────────

/** Coerce anything into a valid value for a property, or null. */
export function normalizeValue(prop: Property, raw: unknown): Value {
  const optIds = new Set((prop.options ?? []).map((o) => o.id));
  switch (prop.type) {
    case "text":
    case "url":
      return typeof raw === "string" ? raw.slice(0, 5000) : raw == null ? null : String(raw).slice(0, 5000);
    case "number": {
      if (raw === "" || raw == null) return null;
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    case "select":
    case "status":
      return typeof raw === "string" && optIds.has(raw) ? raw : null;
    case "multiSelect":
      return Array.isArray(raw) ? [...new Set(raw.filter((x): x is string => typeof x === "string" && optIds.has(x)))] : [];
    case "person":
    case "relation":
      return Array.isArray(raw) ? [...new Set(raw.filter((x): x is string => typeof x === "string" && x.length > 0))].slice(0, 50) : [];
    case "date":
      return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    case "checkbox":
      return raw === true || raw === "true";
  }
}

export function isEmpty(v: Value | undefined) {
  return v == null || v === "" || v === false || (Array.isArray(v) && v.length === 0);
}

export function optionOf(prop: Property, id: unknown) {
  return prop.options?.find((o) => o.id === id) ?? null;
}

/** The status groups, and which option is "done" for progress and filters. */
export function isDone(prop: Property | undefined, v: Value | undefined) {
  if (!prop) return false;
  if (prop.type === "checkbox") return v === true;
  if (prop.type === "status") return optionOf(prop, v)?.group === "done";
  return false;
}

/** Plain text for sorting, searching and exports. `names` maps person/row ids to names. */
export function valueText(prop: Property, v: Value | undefined, names: Record<string, string> = {}): string {
  if (isEmpty(v) && prop.type !== "checkbox") return "";
  switch (prop.type) {
    case "select":
    case "status":
      return optionOf(prop, v)?.name ?? "";
    case "multiSelect":
      return (v as string[]).map((id) => optionOf(prop, id)?.name ?? "").filter(Boolean).join(", ");
    case "person":
    case "relation":
      return (v as string[]).map((id) => names[id] ?? "").filter(Boolean).join(", ");
    case "checkbox":
      return v ? "Yes" : "No";
    default:
      return String(v);
  }
}

// ── Views ──────────────────────────────────────────────────────

export function matchesFilter(row: RowLike, f: Filter, schema: DbSchema, me: string, names: Record<string, string> = {}) {
  if (f.propId === TITLE) {
    const t = row.title.toLowerCase();
    const q = String(f.value ?? "").toLowerCase();
    if (f.op === "contains") return t.includes(q);
    if (f.op === "empty") return !row.title.trim();
    if (f.op === "not_empty") return Boolean(row.title.trim());
    return true;
  }
  const prop = schema.properties.find((p) => p.id === f.propId);
  if (!prop) return true; // a deleted property filters nothing
  const v = row.props[prop.id] ?? null;
  switch (f.op) {
    case "empty":
      return isEmpty(v);
    case "not_empty":
      return !isEmpty(v);
    case "checked":
      return v === true;
    case "unchecked":
      return v !== true;
    case "done":
      return isDone(prop, v);
    case "not_done":
      return !isDone(prop, v);
    case "me":
      return Array.isArray(v) && v.includes(me);
    case "is":
      return Array.isArray(v) ? v.includes(String(f.value)) : v === f.value || String(v) === String(f.value);
    case "is_not":
      return Array.isArray(v) ? !v.includes(String(f.value)) : !(v === f.value || String(v) === String(f.value));
    case "contains":
      return valueText(prop, v, names).toLowerCase().includes(String(f.value ?? "").toLowerCase());
    case "before":
      return typeof v === "string" && typeof f.value === "string" && v < f.value;
    case "after":
      return typeof v === "string" && typeof f.value === "string" && v > f.value;
  }
}

function sortKey(row: RowLike, propId: string, schema: DbSchema, names: Record<string, string>): string | number | null {
  if (propId === TITLE) return row.title.toLowerCase() || null;
  if (propId === "created") return row.createdAt;
  if (propId === "updated") return row.updatedAt;
  const prop = schema.properties.find((p) => p.id === propId);
  if (!prop) return null;
  const v = row.props[prop.id];
  if (isEmpty(v) && prop.type !== "checkbox") return null;
  if (prop.type === "number") return v as number;
  if (prop.type === "checkbox") return v ? 1 : 0;
  if (prop.type === "select" || prop.type === "status") {
    // Option order is meaningful (To do → Doing → Done), so sort by it.
    return prop.options?.findIndex((o) => o.id === v) ?? null;
  }
  return valueText(prop, v ?? null, names).toLowerCase();
}

/** Filter then sort. Empty values always sort last. Stable for equal keys. */
export function applyView<R extends RowLike>(rows: R[], schema: DbSchema, config: ViewConfig, me: string, names: Record<string, string> = {}, search = ""): R[] {
  const q = search.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      config.filters.every((f) => matchesFilter(r, f, schema, me, names)) &&
      (!q ||
        r.title.toLowerCase().includes(q) ||
        schema.properties.some((p) => valueText(p, r.props[p.id] ?? null, names).toLowerCase().includes(q))),
  );
  if (config.sorts.length === 0) return filtered;
  return filtered
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      for (const s of config.sorts) {
        const ka = sortKey(a.r, s.propId, schema, names);
        const kb = sortKey(b.r, s.propId, schema, names);
        if (ka === kb) continue;
        if (ka === null) return 1;
        if (kb === null) return -1;
        const c = ka < kb ? -1 : 1;
        return s.dir === "asc" ? c : -c;
      }
      return a.i - b.i;
    })
    .map((x) => x.r);
}

export type Group<R extends RowLike = RowLike> = { key: string; label: string; color: TagColor; rows: R[] };

/** Board columns: one per option (in order) or person, plus "No value" if needed. */
export function groupRows<R extends RowLike>(rows: R[], prop: Property | undefined, names: Record<string, string> = {}): Group<R>[] {
  if (!prop) return [{ key: "all", label: "All", color: "gray", rows }];
  const groups = new Map<string, Group<R>>();
  if (prop.options) for (const o of prop.options) groups.set(o.id, { key: o.id, label: o.name, color: o.color, rows: [] });
  const none: Group<R> = { key: "", label: `No ${prop.name.toLowerCase()}`, color: "gray", rows: [] };
  for (const r of rows) {
    const v = r.props[prop.id];
    const keys = Array.isArray(v) ? v : v == null || v === "" ? [] : [String(v)];
    if (keys.length === 0) {
      none.rows.push(r);
      continue;
    }
    for (const k of keys) {
      if (!groups.has(k)) groups.set(k, { key: k, label: names[k] ?? optionOf(prop, k)?.name ?? "Unknown", color: "gray", rows: [] });
      groups.get(k)!.rows.push(r);
    }
  }
  return [...groups.values(), ...(none.rows.length || !prop.options ? [none] : [])];
}

/** What value a card dropped into a board column should take. */
export function valueForGroup(prop: Property, current: Value | undefined, from: string, to: string): Value {
  if (prop.type === "multiSelect" || prop.type === "person") {
    const set = new Set(Array.isArray(current) ? current : []);
    if (from) set.delete(from);
    if (to) set.add(to);
    return [...set];
  }
  return to || null;
}

/** Share of rows done, for goals and progress bars (0–1, null when nothing to count). */
export function progress(rows: RowLike[], doneProp: Property | undefined) {
  if (!doneProp || rows.length === 0) return null;
  return rows.filter((r) => isDone(doneProp, r.props[doneProp.id])).length / rows.length;
}

// ── Validation for stored JSON ─────────────────────────────────

const optionSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(60),
  color: z.enum(["gray", "brown", "orange", "yellow", "green", "blue", "purple", "pink", "red"]),
  group: z.enum(["todo", "doing", "done"]).optional(),
});

export const propertySchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(60),
  type: z.enum(PROPERTY_TYPES),
  options: z.array(optionSchema).max(100).optional(),
  relation: z.object({ databaseId: z.string().max(64) }).optional(),
});

export const dbSchemaSchema = z.object({ properties: z.array(propertySchema).max(60) });

export const viewConfigSchema = z.object({
  filters: z
    .array(
      z.object({
        propId: z.string().max(40),
        op: z.enum(["is", "is_not", "contains", "empty", "not_empty", "checked", "unchecked", "me", "before", "after", "done", "not_done"]),
        value: z.union([z.string().max(200), z.number(), z.null()]).optional(),
      }),
    )
    .max(20),
  sorts: z.array(z.object({ propId: z.string().max(40), dir: z.enum(["asc", "desc"]) })).max(5),
  groupBy: z.string().max(40).nullable().optional(),
  hidden: z.array(z.string().max(40)).max(60).optional(),
  dateProp: z.string().max(40).nullable().optional(),
});

/** Read stored property definitions, keeping every valid one (a bad one never hides the rest). */
export function readSchema(json: unknown): DbSchema {
  const raw = json && typeof json === "object" && Array.isArray((json as { properties?: unknown }).properties) ? (json as { properties: unknown[] }).properties : [];
  const properties: Property[] = [];
  for (const p of raw) {
    const parsed = propertySchema.safeParse(p);
    if (parsed.success) properties.push(parsed.data as Property);
  }
  return { properties };
}

export function readConfig(json: unknown): ViewConfig {
  const parsed = viewConfigSchema.safeParse(json);
  return parsed.success ? (parsed.data as ViewConfig) : emptyConfig();
}

/** Default options for a new status property. */
export const DEFAULT_STATUS: Option[] = [
  { id: "todo", name: "Not started", color: "gray", group: "todo" },
  { id: "doing", name: "In progress", color: "blue", group: "doing" },
  { id: "done", name: "Done", color: "green", group: "done" },
];
