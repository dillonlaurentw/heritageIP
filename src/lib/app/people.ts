import "server-only";
import { FIELDS, type Field } from "../app-rules";
import { db } from "../db";
import { sendEmail } from "../email";
import { conciergeUserId } from "../network";
import { CATEGORY_COPY, type PartnerCategory } from "../partner-categories";
import type { Viewer } from "../session";
import { blockedBetween, blockedIds } from "./safety";

type Fail = { ok: false; message: string };
const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const clean = (s: string, max: number) => s.trim().slice(0, max);

async function companyOf(userId: string) {
  const m = await db.workspaceMember.findFirst({
    where: { userId, role: { in: ["OWNER", "ADMIN"] }, workspace: { kind: "TEAM" } },
    orderBy: { joinedAt: "asc" },
    select: { workspace: { select: { id: true, name: true } } },
  });
  return m?.workspace ?? null;
}

type State = "none" | "pending" | "yes" | "not now";
const stateOf = (s?: { status: string }): State =>
  !s || s.status === "WITHDRAWN" ? "none" : s.status === "PENDING" ? "pending" : s.status === "ACCEPTED" ? "yes" : "not now";

// ── Partners ──────────────────────────────────────────────────

/** Firms that do the work (legal, suppliers, marketing…). Their contact details only come with a yes. */
export async function listPartners(viewer: Viewer) {
  const [firms, sigs] = await Promise.all([
    db.partner.findMany({
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      select: { id: true, name: true, tagline: true, description: true, categories: true, services: true, location: true, priceNote: true, claimedById: true },
    }),
    db.signal.findMany({ where: { kind: "PARTNER_INTRO", fromUserId: viewer.user.id }, orderBy: { createdAt: "desc" }, select: { partnerId: true, status: true } }),
  ]);
  return firms
    .filter((f) => f.claimedById !== viewer.user.id)
    .map((f) => ({
      id: f.id,
      name: f.name,
      tagline: f.tagline,
      description: f.description,
      categories: f.categories.map((c) => CATEGORY_COPY[c as PartnerCategory].label),
      services: f.services,
      location: f.location,
      priceNote: f.priceNote,
      intro: stateOf(sigs.find((s) => s.partnerId === f.id)),
    }));
}

/** Ask for an intro: the firm (or SELF's concierge, for firms not on SELF yet) answers. */
export async function askPartner(viewer: Viewer, partnerId: string, note: string): Promise<{ ok: true } | Fail> {
  const body = clean(note, 1000);
  if (body.length < 20) return { ok: false, message: "Say what you're building and what you need from them." };
  const firm = await db.partner.findUnique({ where: { id: partnerId }, select: { id: true, name: true, claimedById: true } });
  if (!firm) return { ok: false, message: "That partner doesn't exist." };
  if (firm.claimedById === viewer.user.id) return { ok: false, message: "That's your own firm." };
  if (firm.claimedById && (await blockedBetween(viewer.user.id, firm.claimedById))) return { ok: false, message: `${firm.name} isn't taking intros right now.` };
  const live = await db.signal.count({ where: { kind: "PARTNER_INTRO", fromUserId: viewer.user.id, partnerId, status: { in: ["PENDING", "ACCEPTED"] } } });
  if (live) return { ok: false, message: `You've already asked for an intro to ${firm.name}.` };
  const toUserId = firm.claimedById ?? (await conciergeUserId());
  if (!toUserId) return { ok: false, message: "Intros aren't set up yet: SELF needs an admin." };
  const company = await companyOf(viewer.user.id);
  const s = await db.signal.create({
    data: { kind: "PARTNER_INTRO", fromUserId: viewer.user.id, toUserId, partnerId, workspaceId: company?.id ?? null, note: body },
    include: { toUser: { select: { email: true } } },
  });
  await db.notification.create({
    data: { userId: toUserId, actorId: viewer.user.id, kind: "SIGNAL", text: `${viewer.user.name} would like an intro to ${firm.name}`, href: "/network/connections", signalId: s.id },
  });
  await sendEmail({
    to: s.toUser.email,
    subject: `Intro request: ${viewer.user.name} → ${firm.name}`,
    text: [
      `${viewer.user.name}${company ? ` (${company.name})` : ""} would like an intro to ${firm.name}.`,
      `"${body}"`,
      firm.claimedById ? null : `You're receiving this as SELF's concierge because ${firm.name} isn't on SELF yet.`,
      `Answer in the SELF app, or at ${appUrl()}/network/connections`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
  return { ok: true };
}

// ── Co-founders ───────────────────────────────────────────────

/**
 * People open to building with someone (opt-in, off by default). Shows only
 * what they chose to share; same field first; never a score.
 */
export async function coFounders(viewer: Viewer) {
  const uid = viewer.user.id;
  const people = await db.profile.findMany({
    where: { openToMatches: true, access: "MEMBER", onboardedAt: { not: null }, userId: { not: uid } },
    orderBy: { openToMatchesAt: "desc" },
    select: { userId: true, headline: true, location: true, strengths: true, buildingToward: true, openToMatchesNote: true, buildField: true, user: { select: { name: true } } },
  });
  const sigs = await db.signal.findMany({
    where: { kind: "ROLE_INVITE", OR: [{ fromUserId: uid, toUserId: { in: people.map((p) => p.userId) } }, { toUserId: uid, fromUserId: { in: people.map((p) => p.userId) } }] },
    orderBy: { createdAt: "desc" },
    select: { fromUserId: true, toUserId: true, status: true },
  });
  const mine = viewer.profile.buildField;
  const blocked = await blockedIds(uid);
  return people
    .filter((p) => !blocked.has(p.userId))
    .map((p) => ({
      id: p.userId,
      name: p.user.name,
      headline: p.headline,
      location: p.location,
      strengths: p.strengths,
      buildingToward: p.buildingToward,
      lookingFor: p.openToMatchesNote,
      field: p.buildField ? (FIELDS[p.buildField as Field] ?? null) : null,
      sameField: !!mine && p.buildField === mine,
      hello: stateOf(sigs.find((s) => s.fromUserId === p.userId || s.toUserId === p.userId)),
    }))
    .sort((a, b) => Number(b.sameField) - Number(a.sameField));
}

/** Say hello to someone open to building together. A yes opens a conversation. */
export async function sayHello(viewer: Viewer, personId: string, note: string): Promise<{ ok: true } | Fail> {
  const body = clean(note, 1000);
  if (body.length < 20) return { ok: false, message: "Say what you're building and why you'd like to talk." };
  if (personId === viewer.user.id) return { ok: false, message: "That's you." };
  const p = await db.profile.findUnique({ where: { userId: personId }, select: { openToMatches: true, user: { select: { name: true, email: true } } } });
  if (!p?.openToMatches || (await blockedBetween(viewer.user.id, personId))) return { ok: false, message: "They aren't open to new conversations right now." };
  const live = await db.signal.count({
    where: {
      kind: "ROLE_INVITE",
      status: { in: ["PENDING", "ACCEPTED"] },
      OR: [
        { fromUserId: viewer.user.id, toUserId: personId },
        { fromUserId: personId, toUserId: viewer.user.id },
      ],
    },
  });
  if (live) return { ok: false, message: `You and ${p.user.name} are already in touch.` };
  const company = await companyOf(viewer.user.id);
  const s = await db.signal.create({ data: { kind: "ROLE_INVITE", fromUserId: viewer.user.id, toUserId: personId, workspaceId: company?.id ?? null, note: body } });
  await db.notification.create({ data: { userId: personId, actorId: viewer.user.id, kind: "SIGNAL", text: `${viewer.user.name} would like to talk about building together`, href: "/network/connections", signalId: s.id } });
  await sendEmail({ to: p.user.email, subject: `${viewer.user.name} would like to talk`, text: `"${body}"\n\nSay yes (a conversation opens) or not now in the SELF app.` });
  return { ok: true };
}

/** Your own switch: open to building with someone, and what you're looking for. */
export async function setOpenToMatches(viewer: Viewer, on: boolean, note: string | null): Promise<{ ok: true } | Fail> {
  const n = note === null ? viewer.profile.openToMatchesNote : clean(note, 200) || null;
  if (on && !n) return { ok: false, message: "Say in a line what you're looking for, so people know why to say hello." };
  await db.profile.update({ where: { userId: viewer.user.id }, data: { openToMatches: on, openToMatchesAt: on ? new Date() : null, openToMatchesNote: n } });
  return { ok: true };
}
