import "server-only";
import type { OpportunityKind } from "@/generated/prisma/client";
import { fitSentence, mayHost, OPPORTUNITY_KINDS, opportunityFit, opportunityProblem, pickProblem, requestProblem } from "../app-rules";
import { db } from "../db";
import { conversationFromYes } from "../messages";
import type { Viewer } from "../session";
import { blockedBetween, blockedIds } from "./safety";

type Fail = { ok: false; message: string };
const DAY = 86_400_000;

/**
 * Opportunities: dinners, trips, workshops, seats at events. Selective, never
 * pay-to-play: you see the ones that fit you, with the reason in words; you
 * say in a line why you'd come; the host picks. SELF takes no payments.
 */

/** Building lately = wrote in your journal or talked in your circle in the last two weeks. */
export async function buildingLately(userId: string, now = new Date()) {
  const since = new Date(now.getTime() - 14 * DAY);
  const [j, c] = await Promise.all([
    db.journalMessage.count({ where: { userId, role: "ME", createdAt: { gte: since } } }),
    db.circleMessage.count({ where: { authorId: userId, createdAt: { gte: since } } }),
  ]);
  return j + c > 0;
}

const hostSelect = { id: true, name: true, profile: { select: { headline: true, partnerOrgName: true } } } as const;

function shape(o: {
  id: string;
  kind: OpportunityKind;
  title: string;
  description: string;
  place: string;
  startsAt: Date;
  seats: number;
  forWho: string;
  costNote: string | null;
  closedAt: Date | null;
  host: { id: string; name: string; profile: { headline: string | null; partnerOrgName: string | null } | null };
}) {
  return {
    id: o.id,
    kind: o.kind,
    kindLabel: OPPORTUNITY_KINDS[o.kind],
    title: o.title,
    description: o.description,
    place: o.place,
    startsAt: o.startsAt.toISOString(),
    seats: o.seats,
    forWho: o.forWho,
    costNote: o.costNote,
    open: !o.closedAt,
    host: { id: o.host.id, name: o.host.name, line: o.host.profile?.partnerOrgName ?? o.host.profile?.headline ?? null },
  };
}

/** The ones that fit you (with why), and the ones you've asked about. Nothing else is shown. */
export async function opportunitiesFor(viewer: Viewer, now = new Date()) {
  const uid = viewer.user.id;
  const [rows, lately, blocked] = await Promise.all([
    db.opportunity.findMany({
      where: { startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      include: { host: { select: hostSelect }, requests: { where: { userId: uid }, select: { status: true } } },
    }),
    buildingLately(uid, now),
    blockedIds(uid),
  ]);
  const person = { id: uid, field: viewer.profile.buildField, stage: viewer.profile.buildStage, buildingLately: lately };
  const out = [];
  for (const o of rows) {
    const mine = o.requests[0]?.status ?? null;
    const why = opportunityFit(o, person);
    // You always see ones you've asked about; otherwise only open ones that fit.
    if (!mine && (!why || o.closedAt || blocked.has(o.hostId))) continue;
    out.push({ ...shape(o), why: why ? fitSentence(why) : null, request: mine });
  }
  return out;
}

export async function opportunityDetail(viewer: Viewer, id: string, now = new Date()) {
  const o = await db.opportunity.findUnique({
    where: { id },
    include: { host: { select: hostSelect }, requests: { where: { userId: viewer.user.id }, select: { status: true, why: true } } },
  });
  if (!o) return null;
  const mine = o.requests[0] ?? null;
  const isHost = o.hostId === viewer.user.id;
  if (!isHost && !mine) {
    const why = opportunityFit(o, { id: viewer.user.id, field: viewer.profile.buildField, stage: viewer.profile.buildStage, buildingLately: await buildingLately(viewer.user.id, now) });
    if (!why) return null; // not for them: it doesn't exist as far as they're concerned
    return { ...shape(o), why: fitSentence(why), request: null, myWhy: null, isHost };
  }
  return { ...shape(o), why: null, request: mine?.status ?? null, myWhy: mine?.why ?? null, isHost };
}

/** "I'd like to come": one line on why. One request per person per opportunity. */
export async function requestSeat(viewer: Viewer, id: string, why: string, now = new Date()): Promise<{ ok: true } | Fail> {
  const o = await db.opportunity.findUnique({ where: { id } });
  if (!o) return { ok: false, message: "That opportunity doesn't exist." };
  if (await blockedBetween(viewer.user.id, o.hostId)) return { ok: false, message: "This one isn't open to you." };
  const fits = opportunityFit(o, { id: viewer.user.id, field: viewer.profile.buildField, stage: viewer.profile.buildStage, buildingLately: await buildingLately(viewer.user.id, now) });
  if (!fits) return { ok: false, message: "This one isn't open to you." };
  const problem = requestProblem(o, why, now);
  if (problem) return { ok: false, message: problem };
  const existing = await db.opportunityRequest.findUnique({ where: { opportunityId_userId: { opportunityId: id, userId: viewer.user.id } } });
  if (existing && existing.status !== "WITHDRAWN") return { ok: false, message: "You've already asked about this one." };
  await db.opportunityRequest.upsert({
    where: { opportunityId_userId: { opportunityId: id, userId: viewer.user.id } },
    create: { opportunityId: id, userId: viewer.user.id, why: why.trim() },
    update: { why: why.trim(), status: "PENDING", answeredAt: null, createdAt: now },
  });
  await db.notification.create({
    data: { userId: o.hostId, actorId: viewer.user.id, kind: "SIGNAL", text: `${viewer.user.name} would like to come to “${o.title}”`, href: "/network" },
  });
  return { ok: true };
}

export async function withdrawSeat(viewer: Viewer, id: string): Promise<{ ok: true } | Fail> {
  const { count } = await db.opportunityRequest.updateMany({ where: { opportunityId: id, userId: viewer.user.id, status: { in: ["PENDING", "PICKED"] } }, data: { status: "WITHDRAWN", answeredAt: new Date() } });
  return count ? { ok: true } : { ok: false, message: "Nothing to withdraw." };
}

// ── Hosts ─────────────────────────────────────────────────────

export async function hosting(viewer: Viewer) {
  const blocked = await blockedIds(viewer.user.id);
  const rows = await db.opportunity.findMany({
    where: { hostId: viewer.user.id },
    orderBy: { startsAt: "asc" },
    include: {
      host: { select: hostSelect },
      requests: {
        where: { status: { not: "WITHDRAWN" } },
        orderBy: { createdAt: "asc" },
        select: { id: true, why: true, status: true, createdAt: true, user: { select: { id: true, name: true, profile: { select: { headline: true } } } } },
      },
    },
  });
  return rows.map((o) => ({
    ...shape(o),
    picked: o.requests.filter((r) => r.status === "PICKED").length,
    requests: o.requests.filter((r) => !blocked.has(r.user.id)).map((r) => ({ id: r.id, why: r.why, status: r.status, at: r.createdAt.toISOString(), who: { id: r.user.id, name: r.user.name, headline: r.user.profile?.headline ?? null } })),
  }));
}

export async function createOpportunity(
  viewer: Viewer,
  input: { kind: OpportunityKind; title: string; description: string; place: string; startsAt: Date; seats: number; forWho: string; fields: string[]; stages: string[]; buildingOnly: boolean; costNote?: string | null },
  now = new Date(),
): Promise<{ ok: true; id: string } | Fail> {
  if (!mayHost(viewer.profile.roles)) return { ok: false, message: "Mentors, partners and backers can host. Ask SELF if you'd like to." };
  const problem = opportunityProblem(input, now);
  if (problem) return { ok: false, message: problem };
  const o = await db.opportunity.create({
    data: { ...input, hostId: viewer.user.id, title: input.title.trim(), description: input.description.trim(), place: input.place.trim(), forWho: input.forWho.trim(), costNote: input.costNote?.trim() || null },
  });
  return { ok: true, id: o.id };
}

/** Pick someone (a seat, and the two of you can message), or say not this time. */
export async function answerSeat(viewer: Viewer, requestId: string, pick: boolean): Promise<{ ok: true; conversationId?: string } | Fail> {
  const r = await db.opportunityRequest.findUnique({ where: { id: requestId }, include: { opportunity: true } });
  if (!r || r.opportunity.hostId !== viewer.user.id) return { ok: false, message: "That request isn't yours to answer." };
  if (pick) {
    const picked = await db.opportunityRequest.count({ where: { opportunityId: r.opportunityId, status: "PICKED" } });
    const full = pickProblem(r.opportunity.seats, picked);
    if (full) return { ok: false, message: full };
  }
  const { count } = await db.opportunityRequest.updateMany({ where: { id: requestId, status: "PENDING" }, data: { status: pick ? "PICKED" : "NOT_THIS_TIME", answeredAt: new Date() } });
  if (!count) return { ok: false, message: "This one has already been answered." };
  await db.notification.create({
    data: {
      userId: r.userId,
      actorId: viewer.user.id,
      kind: "SIGNAL_ANSWERED",
      text: pick ? `You're in: “${r.opportunity.title}”` : `Not this time for “${r.opportunity.title}”. There'll be others.`,
      href: "/network",
    },
  });
  if (!pick) return { ok: true };
  const conversationId = await conversationFromYes(viewer.user.id, r.userId, null, `You're in for “${r.opportunity.title}”. Looking forward to it.`);
  return { ok: true, conversationId };
}

export async function closeOpportunity(viewer: Viewer, id: string): Promise<{ ok: true } | Fail> {
  const { count } = await db.opportunity.updateMany({ where: { id, hostId: viewer.user.id, closedAt: null }, data: { closedAt: new Date() } });
  return count ? { ok: true } : { ok: false, message: "Nothing to close." };
}
