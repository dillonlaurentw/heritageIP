"use client";

import { applyAwarenessUpdate, Awareness, encodeAwarenessUpdate, removeAwarenessStates } from "y-protocols/awareness";
import * as Y from "yjs";

/*
 * Live co-editing over HTTP. The page's shared Yjs document lives in Postgres
 * as a list of updates (see src/lib/collab.ts). This provider pushes local
 * updates (batched), polls for everyone else's, and shares awareness
 * (cursor, name, colour) so people see who's here.
 */

export const FRAGMENT = "document-store";
/** Fast while someone else is here or edits are flowing; slow when you're alone. */
const POLL_MS = 1000;
const POLL_ALONE_MS = 4000;
const POLL_HIDDEN_MS = 15000;
const ACTIVE_WINDOW_MS = 30000;
const HEARTBEAT_MS = 3000;
const COMPACT_AFTER = 150;

const b64 = (u: Uint8Array) => {
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export type Pull = {
  epoch: number;
  seeded: boolean;
  canWrite: boolean;
  updates: { id: number; clientId: string; data: string }[];
  presence: { clientId: string; userId: string; name: string; state: string }[];
};
export type Peer = { clientId: string; userId: string; name: string };

export async function fetchPull(pageId: string, since: number): Promise<Pull | null> {
  const res = await fetch(`/api/collab/${pageId}?since=${since}`, { cache: "no-store" });
  return res.ok ? res.json() : null;
}

async function post(pageId: string, body: unknown, keepalive = false) {
  const res = await fetch(`/api/collab/${pageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive,
  });
  return res.ok ? res.json() : null;
}

export class HttpProvider {
  readonly awareness: Awareness;
  private since = 0;
  private pending: Uint8Array[] = [];
  private awarenessDirty = true;
  private lastHeartbeat = 0;
  private sinceCompact = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private busy = false;
  private lastActivity = Date.now();
  private peerCount = 0;
  private readonly clientId: string;

  constructor(
    readonly doc: Y.Doc,
    private readonly pageId: string,
    private epoch: number,
    private readonly canWrite: boolean,
    private readonly me: string,
    private readonly handlers: { onPeers?: (peers: Peer[]) => void; onStale?: () => void },
  ) {
    this.awareness = new Awareness(doc);
    this.clientId = String(doc.clientID);
    doc.on("update", this.onUpdate);
    this.awareness.on("update", this.onAwareness);
  }

  /** Catch up from an initial pull, then start polling. */
  start(initial: Pull) {
    this.apply(initial);
    this.tick();
  }

  private onUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === this || !this.canWrite) return;
    this.lastActivity = Date.now();
    this.pending.push(update);
    this.scheduleFlush();
  };

  private onAwareness = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
    if (origin === this) return;
    if ([...added, ...updated, ...removed].includes(this.doc.clientID)) {
      this.awarenessDirty = true;
      this.scheduleFlush();
    }
  };

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, 120);
  }

  private async flush() {
    if (this.stopped) return;
    const update = this.pending.length ? Y.mergeUpdates(this.pending) : null;
    this.pending = [];
    const awareness = this.awarenessDirty || Date.now() - this.lastHeartbeat > HEARTBEAT_MS ? encodeAwarenessUpdate(this.awareness, [this.doc.clientID]) : null;
    if (!update && !awareness) return;
    this.awarenessDirty = false;
    this.lastHeartbeat = Date.now();
    const res = await post(this.pageId, { epoch: this.epoch, clientId: this.clientId, ...(update ? { update: b64(update) } : {}), ...(awareness ? { awareness: b64(awareness) } : {}) }).catch(() => null);
    if (!res && update) this.pending.unshift(update); // retry with the next batch
    if (res?.stale) this.handlers.onStale?.();
  }

  private apply(p: Pull) {
    if (p.epoch !== this.epoch) {
      this.handlers.onStale?.();
      return;
    }
    if (p.updates.some((u) => u.clientId !== this.clientId)) this.lastActivity = Date.now();
    if (p.updates.length) {
      Y.transact(this.doc, () => {
        for (const u of p.updates) Y.applyUpdate(this.doc, bytes(u.data), this);
      }, this);
      this.since = p.updates[p.updates.length - 1].id;
      this.sinceCompact += p.updates.length;
    }
    // Presence: everyone seen recently, minus anyone who left.
    const here = new Set<number>();
    for (const x of p.presence) {
      if (x.clientId === this.clientId) continue;
      here.add(Number(x.clientId));
      applyAwarenessUpdate(this.awareness, bytes(x.state), this);
    }
    const gone = [...this.awareness.getStates().keys()].filter((id) => id !== this.doc.clientID && !here.has(id));
    if (gone.length) removeAwarenessStates(this.awareness, gone, this);
    const peers = new Map<string, Peer>();
    for (const x of p.presence) if (x.clientId !== this.clientId && x.userId !== this.me) peers.set(x.userId, { clientId: x.clientId, userId: x.userId, name: x.name });
    this.peerCount = here.size;
    this.handlers.onPeers?.([...peers.values()]);
  }

  private async tick() {
    if (this.stopped) return;
    if (!this.busy) {
      this.busy = true;
      try {
        await this.flush();
        const p = await fetchPull(this.pageId, this.since);
        if (p && !this.stopped) this.apply(p);
        if (this.canWrite && this.sinceCompact >= COMPACT_AFTER && this.since > 0) {
          this.sinceCompact = 0;
          await post(this.pageId, { epoch: this.epoch, clientId: this.clientId, compact: { upTo: this.since, state: b64(Y.encodeStateAsUpdate(this.doc)) } });
        }
      } catch {
        // Offline for a moment: the next tick catches up.
      } finally {
        this.busy = false;
      }
    }
    const hidden = typeof document !== "undefined" && document.hidden;
    const active = this.peerCount > 0 || Date.now() - this.lastActivity < ACTIVE_WINDOW_MS;
    const delay = hidden ? POLL_HIDDEN_MS : active ? POLL_MS : POLL_ALONE_MS;
    this.timer = setTimeout(() => void this.tick(), delay);
  }

  destroy() {
    if (this.stopped) return;
    void this.flush();
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.doc.off("update", this.onUpdate);
    this.awareness.off("update", this.onAwareness);
    void post(this.pageId, { leave: this.clientId }, true).catch(() => null);
    this.awareness.destroy();
  }
}

/**
 * Connect to a page's shared document. The first person to open a page
 * turns its saved JSON into the shared document ("seeding"); everyone else
 * waits for that. Returns null when live editing isn't possible (then the
 * editor falls back to the saved JSON).
 */
export async function connect(
  pageId: string,
  seed: () => Uint8Array,
  me: string,
  handlers: { onPeers?: (peers: Peer[]) => void; onStale?: () => void },
): Promise<{ doc: Y.Doc; provider: HttpProvider; canWrite: boolean } | null> {
  let first = await fetchPull(pageId, 0);
  if (!first) return null;
  if (!first.updates.length) {
    if (!first.canWrite && !first.seeded) return null;
    if (!first.seeded) {
      const res = await post(pageId, { epoch: first.epoch, clientId: "seed", seed: b64(seed()) });
      if (!res || res.stale) return null;
    }
    // Wait for the seed (ours or someone else's) to be there.
    for (let i = 0; i < 20 && first && !first.updates.length; i++) {
      await new Promise((r) => setTimeout(r, 250));
      first = await fetchPull(pageId, 0);
    }
    if (!first?.updates.length) return null;
  }
  const doc = new Y.Doc();
  const provider = new HttpProvider(doc, pageId, first.epoch, first.canWrite, me, handlers);
  provider.start(first);
  return { doc, provider, canWrite: first.canWrite };
}
