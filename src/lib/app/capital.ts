import "server-only";
import { db } from "../db";
import { sendEmail } from "../email";
import { mentionsTerms, NO_TERMS_MESSAGE } from "../no-terms";
import type { Viewer } from "../session";

type Fail = { ok: false; message: string };

/**
 * Capital, interest only. Founders choose to share short progress updates
 * with backers (never the journal) and switch "open to backers" on. Backers
 * follow updates and can send interest; a yes opens a conversation. No
 * amounts, valuations or terms anywhere (mentionsTerms on every text), and
 * no money moves. Funds come later, only through a licensed partner.
 */

export const isBacker = (v: Viewer) => v.profile.roles.includes("BACKER") || v.profile.roles.includes("ADMIN");

const clean = (s: string, max: number) => s.trim().slice(0, max);

async function companyOf(userId: string) {
  const m = await db.workspaceMember.findFirst({
    where: { userId, role: { in: ["OWNER", "ADMIN"] }, workspace: { kind: "TEAM" } },
    orderBy: { joinedAt: "asc" },
    select: { workspace: { select: { id: true, name: true, oneLiner: true } } },
  });
  return m?.workspace ?? null;
}

// ── Founders ──────────────────────────────────────────────────

export async function myCapital(viewer: Viewer) {
  const uid = viewer.user.id;
  const [updates, followers, interest] = await Promise.all([
    db.founderUpdate.findMany({ where: { authorId: uid }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, text: true, createdAt: true } }),
    db.follow.findMany({ where: { founderId: uid }, select: { backer: { select: { name: true } } } }),
    db.signal.findMany({
      where: { kind: "BACKER_INTEREST", toUserId: uid, status: { in: ["PENDING", "ACCEPTED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, note: true, createdAt: true, fromUser: { select: { name: true } } },
    }),
  ]);
  return {
    openToBackers: viewer.profile.openToBackers,
    updates: updates.map((u) => ({ id: u.id, text: u.text, at: u.createdAt.toISOString() })),
    followers: followers.map((f) => f.backer.name),
    interest: interest.map((s) => ({ id: s.id, status: s.status, note: s.note, at: s.createdAt.toISOString(), from: s.fromUser.name })),
  };
}

export async function setOpenToBackers(viewer: Viewer, on: boolean): Promise<{ ok: true } | Fail> {
  if (on && !(await db.founderUpdate.count({ where: { authorId: viewer.user.id } }))) return { ok: false, message: "Share one update first, so backers have something to read." };
  await db.profile.update({ where: { userId: viewer.user.id }, data: { openToBackers: on } });
  return { ok: true };
}

export async function postUpdate(viewer: Viewer, text: string): Promise<{ ok: true } | Fail> {
  const body = clean(text, 1200);
  if (body.length < 20) return { ok: false, message: "Say what moved: something shipped, learned or decided." };
  const terms = mentionsTerms(body);
  if (terms) return { ok: false, message: NO_TERMS_MESSAGE(terms) };
  await db.founderUpdate.create({ data: { authorId: viewer.user.id, text: body } });
  return { ok: true };
}

export async function deleteUpdate(viewer: Viewer, id: string): Promise<{ ok: true } | Fail> {
  const { count } = await db.founderUpdate.deleteMany({ where: { id, authorId: viewer.user.id } });
  return count ? { ok: true } : { ok: false, message: "That update doesn't exist." };
}

// ── Backers ───────────────────────────────────────────────────

/** Founders open to backers, with their shared updates. Following first. */
export async function foundersForBacker(viewer: Viewer) {
  if (!isBacker(viewer)) return null;
  const uid = viewer.user.id;
  const founders = await db.profile.findMany({
    where: { openToBackers: true, access: "MEMBER", userId: { not: uid }, user: { updates: { some: {} } } },
    select: {
      userId: true,
      headline: true,
      location: true,
      buildField: true,
      buildStage: true,
      user: { select: { name: true, updates: { orderBy: { createdAt: "desc" }, take: 3, select: { id: true, text: true, createdAt: true } } } },
    },
  });
  const ids = founders.map((f) => f.userId);
  const [follows, sigs, companies] = await Promise.all([
    db.follow.findMany({ where: { backerId: uid, founderId: { in: ids } }, select: { founderId: true } }),
    db.signal.findMany({ where: { kind: "BACKER_INTEREST", fromUserId: uid, toUserId: { in: ids } }, orderBy: { createdAt: "desc" }, select: { toUserId: true, status: true } }),
    Promise.all(ids.map((id) => companyOf(id))),
  ]);
  const following = new Set(follows.map((f) => f.founderId));
  return founders
    .map((f, i) => {
      const s = sigs.find((x) => x.toUserId === f.userId);
      return {
        id: f.userId,
        name: f.user.name,
        headline: f.headline,
        location: f.location,
        company: companies[i] ? { name: companies[i]!.name, oneLiner: companies[i]!.oneLiner } : null,
        following: following.has(f.userId),
        interest: !s || s.status === "WITHDRAWN" ? "none" : s.status === "PENDING" ? "pending" : s.status === "ACCEPTED" ? "yes" : "not now",
        updates: f.user.updates.map((u) => ({ id: u.id, text: u.text, at: u.createdAt.toISOString() })),
      };
    })
    .sort((a, b) => Number(b.following) - Number(a.following) || (b.updates[0]?.at ?? "").localeCompare(a.updates[0]?.at ?? ""));
}

export async function follow(viewer: Viewer, founderId: string, on: boolean): Promise<{ ok: true } | Fail> {
  if (!isBacker(viewer)) return { ok: false, message: "Only backers follow founders' updates." };
  const open = await db.profile.count({ where: { userId: founderId, openToBackers: true } });
  if (on && !open) return { ok: false, message: "They aren't sharing updates with backers right now." };
  if (on) await db.follow.upsert({ where: { backerId_founderId: { backerId: viewer.user.id, founderId } }, create: { backerId: viewer.user.id, founderId }, update: {} });
  else await db.follow.deleteMany({ where: { backerId: viewer.user.id, founderId } });
  return { ok: true };
}

/** "I'm interested": a note, no amounts or terms. The founder says yes or not now. */
export async function sendInterest(viewer: Viewer, founderId: string, note: string): Promise<{ ok: true } | Fail> {
  if (!isBacker(viewer)) return { ok: false, message: "Only backers can send interest." };
  const body = clean(note, 1000);
  if (body.length < 20) return { ok: false, message: "Say what caught your eye and what you could bring besides money." };
  const terms = mentionsTerms(body);
  if (terms) return { ok: false, message: NO_TERMS_MESSAGE(terms) };
  const founder = await db.profile.findUnique({ where: { userId: founderId }, select: { openToBackers: true, user: { select: { name: true, email: true } } } });
  if (!founder?.openToBackers) return { ok: false, message: "They aren't open to backers right now." };
  const live = await db.signal.count({ where: { kind: "BACKER_INTEREST", fromUserId: viewer.user.id, toUserId: founderId, status: { in: ["PENDING", "ACCEPTED"] } } });
  if (live) return { ok: false, message: `You've already told ${founder.user.name} you're interested.` };
  const company = await companyOf(founderId);
  const s = await db.signal.create({ data: { kind: "BACKER_INTEREST", fromUserId: viewer.user.id, toUserId: founderId, workspaceId: company?.id ?? null, note: body } });
  await db.notification.create({ data: { userId: founderId, actorId: viewer.user.id, kind: "SIGNAL", text: `A backer, ${viewer.user.name}, is interested in what you're building`, href: "/network/connections", signalId: s.id } });
  await sendEmail({
    to: founder.user.email,
    subject: `${viewer.user.name} is interested in what you're building`,
    text: `"${body}"\n\nSay yes (a conversation opens) or not now in the SELF app. SELF makes introductions only: no money moves on SELF.`,
  });
  return { ok: true };
}
