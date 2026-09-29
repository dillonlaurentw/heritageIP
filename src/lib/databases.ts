import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { B } from "./blocks";
import {
  newId,
  normalizeValue,
  readConfig,
  readSchema,
  TYPE_LABEL,
  DEFAULT_STATUS,
  type DbSchema,
  type Property,
  type PropertyType,
  type RowLike,
  type Value,
  type ViewConfig,
  type ViewType,
} from "./db-schema";
import { db } from "./db";
import { insertPage, pageHref } from "./pages";
import type { Viewer } from "./session";
import { SYSTEM_DBS, SYSTEM_RELATIONS, type SystemKey } from "./system-dbs";
import { canEdit } from "./workspace-rules";
import { logActivity, requireWorkspaceRole } from "./workspaces";

export type DatabaseData = Awaited<ReturnType<typeof loadDatabase>>;

async function requireDatabase(dbId: string, viewer: Viewer, min: "GUEST" | "MEMBER" = "MEMBER") {
  const page = await db.page.findUnique({ where: { id: dbId } });
  if (!page || page.kind !== "DATABASE") throw new Error("Database not found.");
  const role = await requireWorkspaceRole(page.workspaceId, viewer, min);
  return { page, role, schema: readSchema(page.schema) };
}

/** Everything a database view needs, for someone in its workspace. */
export async function loadDatabase(dbId: string, viewer: Viewer) {
  const { page, role, schema } = await requireDatabase(dbId, viewer, "GUEST");
  const [ws, views, rows, members] = await Promise.all([
    db.workspace.findUniqueOrThrow({ where: { id: page.workspaceId }, select: { slug: true, name: true, kind: true } }),
    db.databaseView.findMany({ where: { databaseId: page.id }, orderBy: { position: "asc" } }),
    db.page.findMany({
      where: { parentId: page.id, kind: "ROW", archivedAt: null },
      orderBy: { position: "asc" },
      select: { id: true, title: true, icon: true, props: true, createdAt: true, updatedAt: true },
    }),
    db.workspaceMember.findMany({ where: { workspaceId: page.workspaceId }, select: { user: { select: { id: true, name: true } } } }),
  ]);

  // Relation targets: rows of the linked databases, for pickers and labels.
  const targets = [...new Set(schema.properties.filter((p) => p.type === "relation" && p.relation?.databaseId).map((p) => p.relation!.databaseId))];
  const targetRows = targets.length
    ? await db.page.findMany({
        where: { parentId: { in: targets }, kind: "ROW", archivedAt: null, workspaceId: page.workspaceId },
        orderBy: { position: "asc" },
        select: { id: true, title: true, parentId: true },
      })
    : [];
  const targetDbs = targets.length
    ? await db.page.findMany({ where: { id: { in: targets } }, select: { id: true, title: true } })
    : [];

  const names: Record<string, string> = {};
  for (const m of members) names[m.user.id] = m.user.name;
  for (const r of targetRows) names[r.id] = r.title || "Untitled";

  return {
    database: {
      id: page.id,
      title: page.title,
      icon: page.icon,
      description: page.text,
      systemKey: page.systemKey,
      workspaceId: page.workspaceId,
      workspaceSlug: ws.slug,
      workspaceName: ws.kind === "PERSONAL" ? "Private" : ws.name,
    },
    schema,
    views: views.map((v) => ({ id: v.id, name: v.name, type: v.type as ViewType, config: readConfig(v.config) })),
    rows: rows.map(
      (r): RowLike & { icon: string | null; href: string } => ({
        id: r.id,
        title: r.title,
        icon: r.icon,
        props: (r.props ?? {}) as Record<string, Value>,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        href: pageHref(ws.slug, r.id),
      }),
    ),
    people: members.map((m) => m.user),
    names,
    relationTargets: Object.fromEntries(
      targets.map((t) => [
        t,
        {
          title: targetDbs.find((d) => d.id === t)?.title ?? "",
          rows: targetRows.filter((r) => r.parentId === t).map((r) => ({ id: r.id, title: r.title || "Untitled", href: pageHref(ws.slug, r.id) })),
        },
      ]),
    ) as Record<string, { title: string; rows: { id: string; title: string; href: string }[] }>,
    me: viewer.user.id,
    editable: canEdit(role),
  };
}

export type NewDatabase = {
  workspaceId: string;
  parentId?: string | null;
  title: string;
  icon?: string | null;
  description?: string;
  schema: DbSchema;
  views: { name: string; type: ViewType; config: ViewConfig }[];
  systemKey?: string | null;
};

/** Create a database page with its views (the caller checked permissions). */
export async function insertDatabase(input: NewDatabase, userId: string) {
  const page = await insertPage(
    {
      workspaceId: input.workspaceId,
      parentId: input.parentId ?? null,
      kind: "DATABASE",
      title: input.title,
      icon: input.icon ?? null,
      content: input.description ? [B.p(input.description)] : [],
      schema: input.schema,
      systemKey: input.systemKey ?? null,
    },
    userId,
  );
  await db.databaseView.createMany({
    data: input.views.map((v, i) => ({ databaseId: page.id, name: v.name, type: v.type, config: v.config as Prisma.InputJsonValue, position: i })),
  });
  return page;
}

/** A plain new database: a table with a status and a date to start from. */
export async function createDatabase(workspaceId: string, parentId: string | null, title: string, viewer: Viewer) {
  await requireWorkspaceRole(workspaceId, viewer, "MEMBER");
  const page = await insertDatabase(
    {
      workspaceId,
      parentId,
      title,
      schema: {
        properties: [
          { id: newId(), name: "Status", type: "status", options: DEFAULT_STATUS.map((o) => ({ ...o })) },
          { id: newId(), name: "Date", type: "date" },
        ],
      },
      views: [{ name: "Table", type: "TABLE", config: { filters: [], sorts: [], hidden: [] } }],
    },
    viewer.user.id,
  );
  await logActivity(workspaceId, viewer.user.id, "page.created", page.id, { title });
  return page;
}

/** Get a workspace's built-in database, creating it (and its links) if needed. */
export async function ensureSystemDb(workspaceId: string, key: SystemKey, userId: string, parentId: string | null = null) {
  const existing = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId, systemKey: key } } });
  if (existing) {
    if (existing.archivedAt) {
      await db.page.update({ where: { id: existing.id }, data: { archivedAt: null, archivedById: null } });
    }
    return existing;
  }
  const def = SYSTEM_DBS[key];
  const page = await insertDatabase(
    {
      workspaceId,
      parentId,
      title: def.title,
      icon: def.icon,
      description: def.description,
      schema: structuredClone(def.schema),
      views: def.views,
      systemKey: key,
    },
    userId,
  );
  await linkSystemRelations(workspaceId);
  return page;
}

/** Point built-in relation properties (Tasks → Goals, …) at the right databases. */
export async function linkSystemRelations(workspaceId: string) {
  const systems = await db.page.findMany({
    where: { workspaceId, systemKey: { in: Object.keys(SYSTEM_DBS) } },
    select: { id: true, systemKey: true, schema: true },
  });
  const byKey = new Map(systems.map((s) => [s.systemKey, s]));
  for (const rel of SYSTEM_RELATIONS) {
    const from = byKey.get(rel.from);
    const to = byKey.get(rel.to);
    if (!from || !to) continue;
    const schema = readSchema(from.schema);
    const prop = schema.properties.find((p) => p.id === rel.prop);
    if (!prop || prop.relation?.databaseId === to.id) continue;
    prop.relation = { databaseId: to.id };
    await db.page.update({ where: { id: from.id }, data: { schema: schema as Prisma.InputJsonValue } });
  }
}

// ── Rows ───────────────────────────────────────────────────────

export async function addRow(dbId: string, viewer: Viewer, init: { title?: string; props?: Record<string, unknown> } = {}) {
  const { page, schema } = await requireDatabase(dbId, viewer);
  const props: Record<string, Value> = {};
  for (const p of schema.properties) {
    if (init.props && p.id in init.props) props[p.id] = normalizeValue(p, init.props[p.id]);
  }
  const row = await insertPage({ workspaceId: page.workspaceId, parentId: page.id, kind: "ROW", title: init.title ?? "", props }, viewer.user.id);
  return row;
}

async function requireRow(rowId: string, viewer: Viewer) {
  const row = await db.page.findUnique({ where: { id: rowId }, include: { parent: true } });
  if (!row || row.kind !== "ROW" || !row.parent) throw new Error("Row not found.");
  await requireWorkspaceRole(row.workspaceId, viewer, "MEMBER");
  return { row, schema: readSchema(row.parent.schema), database: row.parent };
}

export async function setRowProp(rowId: string, propId: string, raw: unknown, viewer: Viewer) {
  const { row, schema } = await requireRow(rowId, viewer);
  const prop = schema.properties.find((p) => p.id === propId);
  if (!prop) throw new Error("That property no longer exists.");
  const value = normalizeValue(prop, raw);
  const props = { ...((row.props ?? {}) as Record<string, Value>), [propId]: value };
  await db.page.update({ where: { id: rowId }, data: { props: props as Prisma.InputJsonValue, updatedById: viewer.user.id } });
  if ((prop.type === "status" && prop.options?.find((o) => o.id === value)?.group === "done") || (prop.type === "checkbox" && value === true)) {
    await logActivity(row.workspaceId, viewer.user.id, "row.done", row.id, { title: row.title });
  }
  return { value, row };
}

// ── Properties ─────────────────────────────────────────────────

async function saveSchema(dbId: string, schema: DbSchema) {
  await db.page.update({ where: { id: dbId }, data: { schema: schema as Prisma.InputJsonValue } });
}

export async function addProperty(dbId: string, type: PropertyType, viewer: Viewer, name?: string) {
  const { schema } = await requireDatabase(dbId, viewer);
  const prop: Property = { id: newId(), name: name?.trim() || TYPE_LABEL[type], type };
  if (type === "status") prop.options = DEFAULT_STATUS.map((o) => ({ ...o }));
  if (type === "select" || type === "multiSelect") prop.options = [];
  if (type === "relation") prop.relation = { databaseId: "" };
  schema.properties.push(prop);
  await saveSchema(dbId, schema);
  return prop;
}

/** Rename, change options, or point a relation at a database. Type changes aren't allowed. */
export async function updateProperty(dbId: string, propId: string, patch: Partial<Pick<Property, "name" | "options" | "relation">>, viewer: Viewer) {
  const { page, schema } = await requireDatabase(dbId, viewer);
  const prop = schema.properties.find((p) => p.id === propId);
  if (!prop) throw new Error("That property no longer exists.");
  if (patch.name !== undefined) prop.name = patch.name.trim().slice(0, 60) || prop.name;
  if (patch.options !== undefined && prop.options) prop.options = patch.options;
  if (patch.relation !== undefined && prop.type === "relation") {
    const target = await db.page.findUnique({ where: { id: patch.relation.databaseId }, select: { workspaceId: true, kind: true } });
    if (!target || target.workspaceId !== page.workspaceId || target.kind !== "DATABASE") throw new Error("Pick a database in this workspace.");
    prop.relation = patch.relation;
  }
  await saveSchema(dbId, schema);
  return prop;
}

export async function deleteProperty(dbId: string, propId: string, viewer: Viewer) {
  const { page, schema } = await requireDatabase(dbId, viewer);
  if (page.systemKey && SYSTEM_DBS[page.systemKey as SystemKey]?.schema.properties.some((p) => p.id === propId)) {
    throw new Error("Built-in properties can be hidden, not deleted.");
  }
  schema.properties = schema.properties.filter((p) => p.id !== propId);
  await saveSchema(dbId, schema);
}

export async function moveProperty(dbId: string, propId: string, toIndex: number, viewer: Viewer) {
  const { schema } = await requireDatabase(dbId, viewer);
  const i = schema.properties.findIndex((p) => p.id === propId);
  if (i < 0) return;
  const [p] = schema.properties.splice(i, 1);
  schema.properties.splice(Math.max(0, Math.min(toIndex, schema.properties.length)), 0, p);
  await saveSchema(dbId, schema);
}

// ── Views ──────────────────────────────────────────────────────

export async function addView(dbId: string, type: ViewType, viewer: Viewer) {
  const { schema } = await requireDatabase(dbId, viewer);
  const count = await db.databaseView.count({ where: { databaseId: dbId } });
  const groupable = schema.properties.find((p) => p.type === "status" || p.type === "select");
  const dated = schema.properties.find((p) => p.type === "date");
  const config: ViewConfig = {
    filters: [],
    sorts: [],
    hidden: [],
    groupBy: type === "BOARD" ? groupable?.id ?? null : null,
    dateProp: type === "CALENDAR" ? dated?.id ?? null : null,
  };
  const names: Record<ViewType, string> = { TABLE: "Table", BOARD: "Board", LIST: "List", CALENDAR: "Calendar" };
  return db.databaseView.create({ data: { databaseId: dbId, name: names[type], type, config: config as Prisma.InputJsonValue, position: count } });
}

async function requireView(viewId: string, viewer: Viewer) {
  const view = await db.databaseView.findUnique({ where: { id: viewId }, include: { database: { select: { workspaceId: true } } } });
  if (!view) throw new Error("View not found.");
  await requireWorkspaceRole(view.database.workspaceId, viewer, "MEMBER");
  return view;
}

export async function updateView(viewId: string, patch: { name?: string; config?: ViewConfig }, viewer: Viewer) {
  await requireView(viewId, viewer);
  return db.databaseView.update({
    where: { id: viewId },
    data: {
      ...(patch.name !== undefined ? { name: patch.name.trim().slice(0, 40) || "View" } : {}),
      ...(patch.config !== undefined ? { config: patch.config as Prisma.InputJsonValue } : {}),
    },
  });
}

export async function deleteView(viewId: string, viewer: Viewer) {
  const view = await requireView(viewId, viewer);
  const count = await db.databaseView.count({ where: { databaseId: view.databaseId } });
  if (count <= 1) throw new Error("A database needs at least one view.");
  await db.databaseView.delete({ where: { id: viewId } });
}

/** Databases in a workspace, for relation pickers. */
export async function listDatabases(workspaceId: string) {
  return db.page.findMany({
    where: { workspaceId, kind: "DATABASE", archivedAt: null },
    orderBy: { title: "asc" },
    select: { id: true, title: true, icon: true },
  });
}
