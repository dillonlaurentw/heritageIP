"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addProperty,
  addRow,
  addView,
  createDatabase,
  deleteProperty,
  deleteView,
  listDatabases,
  loadDatabase,
  moveProperty,
  setRowProp,
  updateProperty,
  updateView,
} from "@/lib/databases";
import { PROPERTY_TYPES, propertySchema, viewConfigSchema, type ViewType } from "@/lib/db-schema";
import { db } from "@/lib/db";
import { archivePage, pageHref, updatePage } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";

const id = z.string().min(1).max(64);
type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string };

async function attempt<T extends object>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function loadDatabaseAction(dbId: string) {
  const viewer = await requireOnboarded();
  return attempt(async () => ({ data: await loadDatabase(id.parse(dbId), viewer) }));
}

export async function newDatabase(workspaceId: string, parentId: string | null, title = "Untitled database"): Promise<Result<{ id: string; href: string }>> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    const page = await createDatabase(id.parse(workspaceId), parentId ? id.parse(parentId) : null, z.string().max(200).parse(title), viewer);
    const ws = await db.workspace.findUniqueOrThrow({ where: { id: page.workspaceId }, select: { slug: true } });
    revalidatePath("/", "layout");
    return { id: page.id, href: pageHref(ws.slug, page.id) };
  });
}

export async function addRowAction(dbId: string, init: { title?: string; props?: Record<string, unknown> } = {}): Promise<Result<{ rowId: string }>> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    const row = await addRow(id.parse(dbId), viewer, { title: z.string().max(200).optional().parse(init.title), props: init.props });
    return { rowId: row.id };
  });
}

export async function setRowPropAction(rowId: string, propId: string, value: unknown): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await setRowProp(id.parse(rowId), z.string().max(40).parse(propId), value, viewer);
    return {};
  });
}

export async function setRowTitleAction(rowId: string, title: string): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await updatePage(id.parse(rowId), { title: z.string().max(200).parse(title) }, viewer);
    return {};
  });
}

export async function deleteRowAction(rowId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await archivePage(id.parse(rowId), viewer);
    return {};
  });
}

export async function addPropertyAction(dbId: string, type: string, name?: string): Promise<Result<{ propId: string }>> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    const prop = await addProperty(id.parse(dbId), z.enum(PROPERTY_TYPES).parse(type), viewer, z.string().max(60).optional().parse(name));
    return { propId: prop.id };
  });
}

const propPatch = propertySchema.pick({ name: true, options: true, relation: true }).partial();

export async function updatePropertyAction(dbId: string, propId: string, patch: z.infer<typeof propPatch>): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await updateProperty(id.parse(dbId), z.string().max(40).parse(propId), propPatch.parse(patch), viewer);
    return {};
  });
}

export async function deletePropertyAction(dbId: string, propId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await deleteProperty(id.parse(dbId), z.string().max(40).parse(propId), viewer);
    return {};
  });
}

export async function movePropertyAction(dbId: string, propId: string, toIndex: number): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await moveProperty(id.parse(dbId), z.string().max(40).parse(propId), z.number().int().min(0).max(100).parse(toIndex), viewer);
    return {};
  });
}

export async function addViewAction(dbId: string, type: ViewType): Promise<Result<{ viewId: string }>> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    const view = await addView(id.parse(dbId), z.enum(["TABLE", "BOARD", "LIST", "CALENDAR"]).parse(type), viewer);
    return { viewId: view.id };
  });
}

export async function updateViewAction(viewId: string, patch: { name?: string; config?: unknown }): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await updateView(
      id.parse(viewId),
      { name: z.string().max(40).optional().parse(patch.name), config: patch.config === undefined ? undefined : viewConfigSchema.parse(patch.config) },
      viewer,
    );
    return {};
  });
}

export async function deleteViewAction(viewId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  return attempt(async () => {
    await deleteView(id.parse(viewId), viewer);
    return {};
  });
}

export async function listDatabasesAction(workspaceId: string) {
  const viewer = await requireOnboarded();
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id.parse(workspaceId), userId: viewer.user.id } },
  });
  if (!member) return [];
  return listDatabases(workspaceId);
}
