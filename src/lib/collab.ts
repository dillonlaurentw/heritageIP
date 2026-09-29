import "server-only";
import { db } from "./db";
import type { Viewer } from "./session";
import { atLeast, type WorkspaceRole } from "./workspace-rules";
import { roleIn } from "./workspaces";

/*
 * Live co-editing over plain HTTP, stored in Postgres: no extra service to run.
 * Each page's shared document is the list of Yjs updates for its current
 * epoch. Clients poll for updates after the last id they've seen and push
 * their own; presence (cursors, names) rides along as awareness states.
 */

export const PRESENCE_TTL_MS = 8000;
const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");
const bytes = (s: string) => new Uint8Array(Buffer.from(s, "base64"));

async function access(pageId: string, viewer: Viewer) {
  const page = await db.page.findUnique({ where: { id: pageId }, select: { id: true, workspaceId: true, kind: true, collabEpoch: true, collabSeeded: true, archivedAt: true } });
  if (!page || page.kind === "DATABASE") return null;
  const role = (await roleIn(page.workspaceId, viewer.user.id)) as WorkspaceRole | null;
  if (!role) return null;
  return { page, canWrite: atLeast(role, "MEMBER") && !page.archivedAt };
}

/** Everything a client needs to catch up: updates after `since`, and who's here. */
export async function pull(pageId: string, viewer: Viewer, since: number) {
  const a = await access(pageId, viewer);
  if (!a) return null;
  const [updates, presence] = await Promise.all([
    db.pageUpdate.findMany({
      where: { pageId, epoch: a.page.collabEpoch, id: { gt: since } },
      orderBy: { id: "asc" },
      take: 500,
      select: { id: true, update: true, clientId: true },
    }),
    db.pagePresence.findMany({
      where: { pageId, updatedAt: { gte: new Date(Date.now() - PRESENCE_TTL_MS) } },
      select: { clientId: true, userId: true, state: true, user: { select: { name: true } } },
    }),
  ]);
  return {
    epoch: a.page.collabEpoch,
    seeded: a.page.collabSeeded,
    canWrite: a.canWrite,
    updates: updates.map((u) => ({ id: u.id, clientId: u.clientId, data: b64(u.update) })),
    presence: presence.map((p) => ({ clientId: p.clientId, userId: p.userId, name: p.user.name, state: b64(p.state) })),
  };
}

export type PushInput = {
  epoch: number;
  clientId: string;
  /** The page's JSON turned into a first Yjs state. Only the first client to send it wins. */
  seed?: string;
  update?: string;
  awareness?: string;
  /** Replace every update up to this id with one merged state (keeps pulls small). */
  compact?: { upTo: number; state: string };
};

export async function push(pageId: string, viewer: Viewer, input: PushInput) {
  const a = await access(pageId, viewer);
  if (!a) return { ok: false as const, status: 404 };
  if (input.epoch !== a.page.collabEpoch) return { ok: true as const, stale: true };
  let seeded: boolean | undefined;
  let id: number | undefined;

  if (input.awareness) {
    const state = Buffer.from(input.awareness, "base64");
    await db.pagePresence.upsert({
      where: { pageId_clientId: { pageId, clientId: input.clientId } },
      create: { pageId, clientId: input.clientId, userId: viewer.user.id, state },
      update: { state, userId: viewer.user.id },
    });
  }
  if (a.canWrite && input.seed) {
    const won = await db.page.updateMany({ where: { id: pageId, collabSeeded: false, collabEpoch: input.epoch }, data: { collabSeeded: true } });
    seeded = won.count === 1;
    if (seeded) id = (await db.pageUpdate.create({ data: { pageId, epoch: input.epoch, clientId: input.clientId, update: bytes(input.seed) } })).id;
  }
  if (a.canWrite && input.update) {
    id = (await db.pageUpdate.create({ data: { pageId, epoch: input.epoch, clientId: input.clientId, update: bytes(input.update) } })).id;
  }
  if (a.canWrite && input.compact) {
    const { upTo, state } = input.compact;
    await db.$transaction([
      db.pageUpdate.deleteMany({ where: { pageId, epoch: input.epoch, id: { lte: upTo } } }),
      db.pageUpdate.create({ data: { id: upTo, pageId, epoch: input.epoch, clientId: input.clientId, update: bytes(state) } }),
    ]);
  }
  return { ok: true as const, stale: false, seeded, id };
}

/**
 * The page's JSON was rewritten on the server (a restored version, a saved
 * thesis): start a fresh shared document from it. Open editors notice the new
 * epoch and reload.
 */
export async function resetCollab(pageId: string) {
  await db.$transaction([
    db.pageUpdate.deleteMany({ where: { pageId } }),
    db.page.update({ where: { id: pageId }, data: { collabEpoch: { increment: 1 }, collabSeeded: false } }),
  ]);
}

/** Leaving a page: drop this client's presence straight away. */
export async function leave(pageId: string, viewer: Viewer, clientId: string) {
  await db.pagePresence.deleteMany({ where: { pageId, clientId, userId: viewer.user.id } });
}
