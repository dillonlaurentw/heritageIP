import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { B } from "./blocks";
import { ensureSystemDb } from "./databases";
import { db } from "./db";
import { push } from "./app/push";
import { conversationFromYes } from "./messages";
import { sendEmail } from "./email";
import { insertPage } from "./pages";
import type { Viewer } from "./session";
import { nextStatus, revealsContact, type SignalAction } from "./signal-rules";
import { logActivity, roleIn } from "./workspaces";

/*
 * The network: every "someone asks, someone answers" connection is a Signal.
 * Contact details only ever come out of contactsFor() / partnerContactsFor(),
 * and only across an ACCEPTED signal. Checked here, on the server.
 */

export type Contact = { email: string | null; link: string | null };
const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
type Fail = { ok: false; message: string };

// ── The gates ─────────────────────────────────────────────────

/** Contact details for people who share an ACCEPTED signal with the viewer. Everyone else is absent. */
export async function contactsFor(viewerId: string, otherIds: string[]): Promise<Map<string, Contact>> {
  const ids = [...new Set(otherIds)].filter((id) => id !== viewerId);
  if (!ids.length) return new Map();
  const accepted = await db.signal.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { fromUserId: viewerId, toUserId: { in: ids } },
        { toUserId: viewerId, fromUserId: { in: ids } },
      ],
    },
    select: { status: true, fromUserId: true, toUserId: true },
  });
  const allowed = ids.filter((id) => accepted.some((s) => revealsContact(s, viewerId, id)));
  if (!allowed.length) return new Map();
  const profiles = await db.profile.findMany({ where: { userId: { in: allowed } }, select: { userId: true, contactEmail: true, contactLink: true } });
  return new Map(profiles.map((p) => [p.userId, { email: p.contactEmail, link: p.contactLink }]));
}

/** A firm's intro address, only after an accepted intro the viewer asked for. */
export async function partnerContactsFor(viewerId: string, partnerIds: string[]) {
  if (!partnerIds.length) return new Map<string, { email: string; website: string | null }>();
  const accepted = await db.signal.findMany({
    where: { kind: "PARTNER_INTRO", status: "ACCEPTED", fromUserId: viewerId, partnerId: { in: partnerIds } },
    select: { partner: { select: { id: true, contactEmail: true, website: true } } },
  });
  return new Map(accepted.filter((a) => a.partner).map((a) => [a.partner!.id, { email: a.partner!.contactEmail, website: a.partner!.website }]));
}

// ── Helpers ───────────────────────────────────────────────────

/** The person who answers for a workspace: its first owner. */
export async function workspaceOwnerId(workspaceId: string) {
  const owner = await db.workspaceMember.findFirst({ where: { workspaceId, role: "OWNER" }, orderBy: { joinedAt: "asc" }, select: { userId: true } });
  return owner?.userId ?? null;
}

/** Who answers intros for unclaimed partners: CONCIERGE_EMAIL, else the earliest admin. */
export async function conciergeUserId() {
  if (process.env.CONCIERGE_EMAIL) {
    const u = await db.user.findUnique({ where: { email: process.env.CONCIERGE_EMAIL }, select: { id: true } });
    if (u) return u.id;
  }
  const admin = await db.profile.findFirst({ where: { roles: { has: "ADMIN" } }, orderBy: { createdAt: "asc" } });
  return admin?.userId ?? null;
}

async function notify(data: { userId: string; actorId: string; kind: "SIGNAL" | "SIGNAL_ANSWERED"; text: string; href: string; signalId: string; workspaceId?: string | null; pageId?: string | null }) {
  await db.notification.create({ data });
  // Phones: a new request opens the answers screen; an answer opens Messages.
  await push([data.userId], { title: "SELF", body: data.text, to: data.kind === "SIGNAL" ? "/requests" : "/messages" });
}

/** A workspace the viewer can act for (MEMBER or above), and a step in its game plan if given. */
async function actingFor(viewer: Viewer, workspaceId: string, stepId?: string | null) {
  const role = await roleIn(workspaceId, viewer.user.id);
  if (!role || role === "GUEST") return null;
  const ws = await db.workspace.findUnique({ where: { id: workspaceId }, select: { id: true, slug: true, name: true, oneLiner: true, kind: true } });
  if (!ws || ws.kind !== "TEAM") return null;
  let step: { id: string; title: string } | null = null;
  if (stepId) {
    const row = await db.page.findFirst({
      where: { id: stepId, workspaceId, kind: "ROW", archivedAt: null, parent: { systemKey: "gamePlan" } },
      select: { id: true, title: true },
    });
    step = row;
  }
  return { ws, step };
}

// ── Roles ─────────────────────────────────────────────────────

/** A posted, open role row (in a Roles database), with its workspace. */
export async function postedRole(roleId: string) {
  const row = await db.page.findFirst({
    where: { id: roleId, kind: "ROW", archivedAt: null, parent: { systemKey: "roles" }, workspace: { kind: "TEAM" } },
    include: { workspace: { select: { id: true, slug: true, name: true, oneLiner: true } } },
  });
  if (!row) return null;
  const p = (row.props ?? {}) as Record<string, unknown>;
  if (p.posted !== true) return null;
  return { row, open: p.state === "open" || !p.state, props: p };
}

/** A builder says "I'm interested" in a role. Lands in the owner's inbox and the Candidates pipeline. */
export async function sendRoleInterest(viewer: Viewer, roleId: string, note: string): Promise<{ ok: true } | Fail> {
  const role = await postedRole(roleId);
  if (!role || !role.open) return { ok: false, message: "This role isn't open any more." };
  const ws = role.row.workspace;
  if (await roleIn(ws.id, viewer.user.id)) return { ok: false, message: `You're already in ${ws.name}.` };
  const existing = await db.signal.findFirst({
    where: { kind: "ROLE_INTEREST", fromUserId: viewer.user.id, pageId: roleId, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) return { ok: false, message: "You've already said you're interested in this role." };
  const ownerId = await workspaceOwnerId(ws.id);
  if (!ownerId) return { ok: false, message: "Nobody can answer for this workspace right now." };

  const signal = await db.signal.create({
    data: { kind: "ROLE_INTEREST", fromUserId: viewer.user.id, toUserId: ownerId, workspaceId: ws.id, pageId: roleId, note },
    include: { toUser: { select: { email: true } } },
  });
  // The candidate appears in the team's pipeline straight away.
  const candidates = await ensureSystemDb(ws.id, "candidates", ownerId);
  await insertPage(
    {
      workspaceId: ws.id,
      parentId: candidates.id,
      kind: "ROW",
      title: viewer.user.name,
      props: { role: [roleId], stage: "new", source: "network", signalId: signal.id },
      content: [B.p(viewer.profile.headline ?? ""), B.quote(note), B.p("Interest from the SELF Network. Contact details appear in Connections once you accept.")],
    },
    ownerId,
  );
  await notify({
    userId: ownerId,
    actorId: viewer.user.id,
    kind: "SIGNAL",
    text: `${viewer.user.name} is interested in “${role.row.title}”`,
    href: "/network/connections",
    signalId: signal.id,
    workspaceId: ws.id,
    pageId: roleId,
  });
  await sendEmail({
    to: signal.toUser.email,
    subject: `${viewer.user.name} is interested in ${role.row.title}`,
    text: `${viewer.user.name} is interested in "${role.row.title}" at ${ws.name}.\n\n"${note}"\n\nAccept or decline: ${appUrl()}/network/connections`,
  });
  return { ok: true };
}

/** Post a role to the Network from a workspace (creates a Roles row). */
export async function postRole(
  viewer: Viewer,
  input: { workspaceId: string; title: string; commitment: string; skills: string; description: string; stepId?: string | null },
): Promise<{ ok: true; href: string } | Fail> {
  const acting = await actingFor(viewer, input.workspaceId, input.stepId);
  if (!acting) return { ok: false, message: "Pick a company you're a member of." };
  const roles = await ensureSystemDb(acting.ws.id, "roles", viewer.user.id);
  const row = await insertPage(
    {
      workspaceId: acting.ws.id,
      parentId: roles.id,
      kind: "ROW",
      title: input.title,
      props: {
        commitment: input.commitment,
        state: "open",
        skills: input.skills,
        posted: true,
        ...(acting.step ? { step: [acting.step.id] } : {}),
      },
      content: input.description ? input.description.split(/\n{2,}/).map((p) => B.p(p.trim())) : [],
    },
    viewer.user.id,
  );
  await logActivity(acting.ws.id, viewer.user.id, "role.posted", row.id, { title: input.title });
  return { ok: true, href: `/network/roles/${row.id}` };
}

// ── Partners and mentors ──────────────────────────────────────

export async function requestIntro(
  viewer: Viewer,
  input: { workspaceId: string; partnerId: string; stepId: string | null; note: string },
): Promise<{ ok: true } | Fail> {
  const acting = await actingFor(viewer, input.workspaceId, input.stepId);
  if (!acting) return { ok: false, message: "Pick a company you're a member of." };
  const partner = await db.partner.findUnique({ where: { id: input.partnerId } });
  if (!partner) return { ok: false, message: "That partner doesn't exist." };
  if (partner.claimedById === viewer.user.id) return { ok: false, message: "That's your own firm." };
  const existing = await db.signal.findFirst({
    where: { kind: "PARTNER_INTRO", workspaceId: acting.ws.id, partnerId: partner.id, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) return { ok: false, message: `${acting.ws.name} has already asked ${partner.name} for an intro.` };
  const toUserId = partner.claimedById ?? (await conciergeUserId());
  if (!toUserId) return { ok: false, message: "Intros aren't set up yet: SELF needs an admin." };

  const signal = await db.signal.create({
    data: { kind: "PARTNER_INTRO", fromUserId: viewer.user.id, toUserId, workspaceId: acting.ws.id, partnerId: partner.id, pageId: acting.step?.id ?? null, note: input.note },
    include: { toUser: { select: { email: true } } },
  });
  await notify({
    userId: toUserId,
    actorId: viewer.user.id,
    kind: "SIGNAL",
    text: `${viewer.user.name} (${acting.ws.name}) asked for an intro to ${partner.name}`,
    href: "/network/connections",
    signalId: signal.id,
  });
  await sendEmail({
    to: signal.toUser.email,
    subject: `Intro request: ${viewer.user.name} → ${partner.name}`,
    text: [
      `${viewer.user.name} (${acting.ws.name}) would like an intro to ${partner.name}.`,
      acting.step ? `For their game-plan step: ${acting.step.title}` : null,
      `"${input.note}"`,
      partner.claimedById ? null : `You're receiving this as SELF's concierge because ${partner.name} hasn't claimed their profile.`,
      `Accept or decline: ${appUrl()}/network/connections`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
  return { ok: true };
}

export async function requestMentor(
  viewer: Viewer,
  input: { workspaceId: string; mentorId: string; stepId: string | null; note: string },
): Promise<{ ok: true } | Fail> {
  const acting = await actingFor(viewer, input.workspaceId, input.stepId);
  if (!acting) return { ok: false, message: "Pick a company you're a member of." };
  if (input.mentorId === viewer.user.id) return { ok: false, message: "You can't mentor yourself." };
  const mentor = await db.profile.findUnique({ where: { userId: input.mentorId }, include: { user: { select: { name: true, email: true } } } });
  if (!mentor || !mentor.roles.includes("MENTOR")) return { ok: false, message: "That person isn't a mentor on SELF." };
  if (!mentor.mentorOpen) return { ok: false, message: `${mentor.user.name} isn't taking new requests right now.` };
  const existing = await db.signal.findFirst({
    where: { kind: "MENTOR_REQUEST", fromUserId: viewer.user.id, toUserId: input.mentorId, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) return { ok: false, message: `You've already asked ${mentor.user.name}.` };

  const signal = await db.signal.create({
    data: { kind: "MENTOR_REQUEST", fromUserId: viewer.user.id, toUserId: input.mentorId, workspaceId: acting.ws.id, pageId: acting.step?.id ?? null, note: input.note },
  });
  await notify({
    userId: input.mentorId,
    actorId: viewer.user.id,
    kind: "SIGNAL",
    text: `${viewer.user.name} (${acting.ws.name}) asked you to mentor them`,
    href: "/network/connections",
    signalId: signal.id,
  });
  await sendEmail({
    to: mentor.user.email,
    subject: `${viewer.user.name} would like your advice`,
    text: `${viewer.user.name} is building ${acting.ws.name}${acting.ws.oneLiner ? `: ${acting.ws.oneLiner}` : ""}.\n\n${acting.step ? `They're working on: ${acting.step.title}\n\n` : ""}"${input.note}"\n\nAccept or decline: ${appUrl()}/network/connections`,
  });
  return { ok: true };
}

// ── Backers: interest only ────────────────────────────────────

export const isBacker = (v: Viewer) => v.profile.roles.includes("BACKER") || v.profile.roles.includes("ADMIN");

/** A backer may see a teaser if the workspace is open to backers, or they already have an accepted signal with it. */
export async function canSeeTeaser(ws: { id: string; discoverable: boolean }, viewer: Viewer) {
  if (await roleIn(ws.id, viewer.user.id)) return true;
  if (!isBacker(viewer)) return false;
  if (ws.discoverable) return true;
  return Boolean(await db.signal.findFirst({ where: { kind: "BACKER_INTEREST", workspaceId: ws.id, fromUserId: viewer.user.id, status: "ACCEPTED" } }));
}

export async function sendBackerInterest(viewer: Viewer, workspaceId: string, note: string): Promise<{ ok: true } | Fail> {
  if (!isBacker(viewer)) return { ok: false, message: "Only backers can signal interest. Add the Backer role on your profile." };
  const ws = await db.workspace.findUnique({ where: { id: workspaceId }, select: { id: true, name: true, discoverable: true, kind: true } });
  if (!ws || ws.kind !== "TEAM" || !ws.discoverable) return { ok: false, message: "This company isn't open to backers right now." };
  if (await roleIn(ws.id, viewer.user.id)) return { ok: false, message: "That's your own company." };
  const existing = await db.signal.findFirst({
    where: { kind: "BACKER_INTEREST", workspaceId: ws.id, fromUserId: viewer.user.id, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) return { ok: false, message: "You've already signalled interest in this company." };
  const ownerId = await workspaceOwnerId(ws.id);
  if (!ownerId) return { ok: false, message: "Nobody can answer for this company right now." };
  const signal = await db.signal.create({
    data: { kind: "BACKER_INTEREST", fromUserId: viewer.user.id, toUserId: ownerId, workspaceId: ws.id, note },
    include: { toUser: { select: { email: true } } },
  });
  await notify({ userId: ownerId, actorId: viewer.user.id, kind: "SIGNAL", text: `A backer, ${viewer.user.name}, is interested in ${ws.name}`, href: "/network/connections", signalId: signal.id, workspaceId: ws.id });
  await sendEmail({
    to: signal.toUser.email,
    subject: `A backer is interested in ${ws.name}`,
    text: `${viewer.user.name} signalled interest in ${ws.name}.\n\n"${note}"\n\nThis is interest only; nothing is offered or committed on SELF. Accept to swap contact details, or decline: ${appUrl()}/network/connections`,
  });
  return { ok: true };
}

// ── Answering ─────────────────────────────────────────────────

/**
 * Accept, decline or withdraw. Accepting reveals contacts to both people
 * (through contactsFor) and emails them; a partner intro emails both sides.
 * A role interest moves the candidate to "Talking"; joining the workspace is
 * a separate, explicit invite.
 */
export async function actOnSignal(signalId: string, viewer: Viewer, action: SignalAction): Promise<{ ok: true; status: string } | Fail> {
  const signal = await db.signal.findUnique({
    where: { id: signalId },
    include: {
      fromUser: { select: { id: true, name: true, email: true, profile: { select: { contactEmail: true, contactLink: true } } } },
      toUser: { select: { id: true, name: true, email: true, profile: { select: { contactEmail: true, contactLink: true } } } },
      workspace: { select: { id: true, name: true, slug: true, oneLiner: true } },
      page: { select: { id: true, title: true } },
      partner: true,
    },
  });
  if (!signal) return { ok: false, message: "That request doesn't exist." };
  const next = nextStatus(signal, action, viewer.user.id);
  if (!next.ok) return { ok: false, message: next.reason };

  // Only move if still pending: a double click can't answer twice.
  const { count } = await db.signal.updateMany({ where: { id: signal.id, status: "PENDING" }, data: { status: next.status, respondedAt: new Date() } });
  if (!count) return { ok: false, message: "This has already been answered." };

  if (signal.kind === "ROLE_INTEREST" && signal.workspaceId && next.status !== "WITHDRAWN") {
    const candidate = await db.page.findFirst({ where: { workspaceId: signal.workspaceId, kind: "ROW", props: { path: ["signalId"], equals: signal.id } } });
    if (candidate) {
      const props = { ...((candidate.props ?? {}) as Record<string, unknown>), stage: next.status === "ACCEPTED" ? "talking" : "passed" };
      await db.page.update({ where: { id: candidate.id }, data: { props: props as Prisma.InputJsonValue } });
    }
  }

  if (action !== "withdraw") {
    await notify({
      userId: signal.fromUserId,
      actorId: viewer.user.id,
      kind: "SIGNAL_ANSWERED",
      text: `${signal.toUser.name} ${next.status === "ACCEPTED" ? "said yes" : "passed"}${signal.partner ? ` on your intro to ${signal.partner.name}` : signal.page ? ` on “${signal.page.title}”` : ""}`,
      href: "/network/connections",
      signalId: signal.id,
      workspaceId: signal.workspaceId,
    });
  }

  if (next.status === "ACCEPTED") {
    const about = signal.partner?.name ?? (signal.page ? `“${signal.page.title}” at ${signal.workspace?.name}` : (signal.workspace?.name ?? "SELF"));
    const card = (u: typeof signal.fromUser) => [u.name, u.profile?.contactEmail, u.profile?.contactLink].filter(Boolean).join("\n");
    if (signal.kind === "PARTNER_INTRO" && signal.partner) {
      await Promise.all([
        sendEmail({
          to: signal.fromUser.email,
          subject: `Intro: you and ${signal.partner.name}`,
          text: `${signal.partner.name} is expecting you.\n\n${signal.partner.contactEmail}${signal.partner.website ? `\n${signal.partner.website}` : ""}\n\n${appUrl()}/network/connections`,
        }),
        sendEmail({
          to: signal.partner.contactEmail,
          subject: `Intro from SELF: ${signal.fromUser.name} of ${signal.workspace?.name}`,
          text: [
            `Meet ${signal.fromUser.name}, building ${signal.workspace?.name}${signal.workspace?.oneLiner ? `: ${signal.workspace.oneLiner}` : ""}.`,
            signal.page ? `They're working on: ${signal.page.title}` : null,
            `In their words: "${signal.note}"`,
            `Reach them at:\n${card(signal.fromUser)}`,
          ]
            .filter(Boolean)
            .join("\n\n"),
        }),
      ]);
    } else {
      await Promise.all([
        sendEmail({ to: signal.fromUser.email, subject: `Yes: ${about}`, text: `${signal.toUser.name} said yes. Here's how to reach them:\n\n${card(signal.toUser)}\n\n${appUrl()}/network/connections` }),
        sendEmail({ to: signal.toUser.email, subject: `You said yes to ${signal.fromUser.name}`, text: `Here's how to reach ${signal.fromUser.name}:\n\n${card(signal.fromUser)}\n\n${appUrl()}/network/connections` }),
      ]);
    }
    // A yes opens the conversation, starting with the note that asked.
    // (A partner intro answered by SELF's concierge stays an email intro: the concierge isn't the firm.)
    const opensChat =
      signal.kind === "ROLE_INVITE" ||
      signal.kind === "MENTOR_REQUEST" ||
      signal.kind === "BACKER_INTEREST" ||
      (signal.kind === "PARTNER_INTRO" && !!signal.partner && signal.partner.claimedById === signal.toUserId);
    if (opensChat) await conversationFromYes(signal.fromUserId, signal.toUserId, signal.workspaceId, signal.note);
    if (signal.workspaceId) await logActivity(signal.workspaceId, viewer.user.id, "signal.accepted", signal.pageId, { title: signal.page?.title ?? "", with: signal.partner?.name ?? signal.fromUser.name });
  }
  return { ok: true, status: next.status };
}

// ── Reading ───────────────────────────────────────────────────

/** Signals tied to a game-plan step, for the step's page ("the intro appears on the step"). */
export async function stepSignals(stepId: string, viewerId: string) {
  const rows = await db.signal.findMany({
    where: { pageId: stepId, status: { in: ["PENDING", "ACCEPTED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      status: true,
      fromUserId: true,
      toUser: { select: { id: true, name: true } },
      partner: { select: { id: true, name: true, slug: true } },
    },
  });
  const partnerContacts = await partnerContactsFor(viewerId, rows.flatMap((r) => (r.partner ? [r.partner.id] : [])));
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    status: r.status,
    who: r.partner?.name ?? r.toUser.name,
    href: r.partner ? `/network/partners/${r.partner.slug}` : r.kind === "MENTOR_REQUEST" ? `/network/mentors/${r.toUser.id}` : "/network/connections",
    contact: r.partner ? (partnerContacts.get(r.partner.id)?.email ?? null) : null,
  }));
}

export async function pendingIncoming(userId: string) {
  return db.signal.count({ where: { toUserId: userId, status: "PENDING" } });
}

/** Options for "which company, which step" pickers: the viewer's team workspaces and open plan steps. */
export async function workspaceOptions(viewer: Viewer) {
  const members = await db.workspaceMember.findMany({
    where: { userId: viewer.user.id, role: { not: "GUEST" }, workspace: { kind: "TEAM" } },
    orderBy: { joinedAt: "asc" },
    select: { workspace: { select: { id: true, slug: true, name: true } } },
  });
  const ids = members.map((m) => m.workspace.id);
  const plans = await db.page.findMany({ where: { workspaceId: { in: ids }, systemKey: "gamePlan", archivedAt: null }, select: { id: true, workspaceId: true } });
  const steps = await db.page.findMany({
    where: { parentId: { in: plans.map((p) => p.id) }, kind: "ROW", archivedAt: null },
    orderBy: { position: "asc" },
    select: { id: true, title: true, workspaceId: true, props: true },
  });
  return members.map((m) => ({
    ...m.workspace,
    steps: steps
      .filter((s) => s.workspaceId === m.workspace.id && (s.props as Record<string, unknown> | null)?.status !== "done")
      .map((s) => ({ id: s.id, title: s.title, needs: ((s.props as Record<string, unknown> | null)?.needs as string[] | undefined) ?? [] })),
  }));
}

