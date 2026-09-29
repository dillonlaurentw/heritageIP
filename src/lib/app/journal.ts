import "server-only";
import { journalAgent, runAgent } from "@/agents";
import { dayOf } from "../app-rules";
import { db } from "../db";
import type { Viewer } from "../session";
import { renderPersona } from "../self-doc";
import { selfOf } from "../self";
import { postToCircle } from "./circles";

type Fail = { ok: false; message: string };

/**
 * The daily journal. PRIVATE: every function here is scoped to the viewer's
 * own rows, and nothing else in SELF (people, admin screens, other agents)
 * reads JournalMessage. The journal agent sees only this person's own
 * journal and their approved Self lines.
 */

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Today's conversation, plus earlier days (newest first) for scrolling back. */
export async function loadJournal(userId: string, now = new Date()) {
  const since = new Date(dayOf(now).getTime() - 13 * 86_400_000);
  const rows = await db.journalMessage.findMany({
    where: { userId, day: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, text: true, day: true, spoken: true, demo: true, sharedAt: true, createdAt: true },
  });
  const today = iso(dayOf(now));
  const shape = (r: (typeof rows)[number]) => ({
    id: r.id,
    who: r.role === "ME" ? ("me" as const) : ("self" as const),
    text: r.text,
    spoken: r.spoken,
    demo: r.demo,
    shared: !!r.sharedAt,
    at: r.createdAt.toISOString(),
  });
  const days = new Map<string, ReturnType<typeof shape>[]>();
  for (const r of rows) {
    const k = iso(r.day);
    days.set(k, [...(days.get(k) ?? []), shape(r)]);
  }
  return {
    today: days.get(today) ?? [],
    earlier: [...days.entries()]
      .filter(([k]) => k !== today)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([day, messages]) => ({ day, messages })),
  };
}

/** Write (or say) something; SELF answers. The entry is kept even if SELF can't answer right now. */
export async function writeJournal(viewer: Viewer, text: string, spoken: boolean, now = new Date()): Promise<{ ok: true; replyError?: string } | Fail> {
  const body = text.trim().slice(0, 4000);
  if (!body) return { ok: false, message: "Say or write something first." };
  const userId = viewer.user.id;
  const day = dayOf(now);
  await db.journalMessage.create({ data: { userId, role: "ME", text: body, day, spoken } });

  const [todayRows, recentRows] = await Promise.all([
    db.journalMessage.findMany({ where: { userId, day }, orderBy: { createdAt: "asc" }, take: 40, select: { role: true, text: true } }),
    db.journalMessage.findMany({
      where: { userId, role: "ME", day: { lt: day, gte: new Date(day.getTime() - 7 * 86_400_000) } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { day: true, text: true },
    }),
  ]);
  const self = renderPersona(viewer.user.name, selfOf(viewer.profile).doc, viewer.profile.headline);
  const res = await runAgent(
    journalAgent,
    {
      self,
      today: todayRows.map((r) => ({ who: r.role === "ME" ? ("me" as const) : ("self" as const), text: r.text })),
      recent: recentRows.map((r) => ({ day: iso(r.day), text: r.text.slice(0, 400) })),
    },
    { userId },
  );
  if (!res.ok) return { ok: true, replyError: res.message };
  await db.journalMessage.create({ data: { userId, role: "SELF", text: res.output.reply, day, demo: res.demo } });
  return { ok: true };
}

/** Delete one of your entries for good. */
export async function deleteJournal(userId: string, id: string): Promise<{ ok: true } | Fail> {
  const { count } = await db.journalMessage.deleteMany({ where: { id, userId } });
  return count ? { ok: true } : { ok: false, message: "That entry doesn't exist." };
}

/**
 * "Share with my circle": copies one of your own entries into your circle's
 * chat. Only what you wrote (never SELF's replies), only when you choose.
 */
export async function shareJournal(userId: string, id: string): Promise<{ ok: true } | Fail> {
  const entry = await db.journalMessage.findFirst({ where: { id, userId, role: "ME" }, select: { text: true } });
  if (!entry) return { ok: false, message: "That entry doesn't exist." };
  // Claim it first so a double tap can't post it twice.
  const { count } = await db.journalMessage.updateMany({ where: { id, userId, sharedAt: null }, data: { sharedAt: new Date() } });
  if (!count) return { ok: false, message: "You've already shared this one." };
  const res = await postToCircle(userId, entry.text, { fromJournal: true });
  if (!res.ok) await db.journalMessage.update({ where: { id }, data: { sharedAt: null } });
  return res;
}

/** Did you write today? (For the home screen's quiet prompt; never a streak.) */
export async function wroteToday(userId: string, now = new Date()) {
  return (await db.journalMessage.count({ where: { userId, role: "ME", day: dayOf(now) } })) > 0;
}
