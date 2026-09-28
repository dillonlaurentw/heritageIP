import "server-only";
import { db } from "./db";
import { sendEmail } from "./email";

const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/**
 * Who answers intros for partners nobody has claimed yet: SELF's concierge.
 * CONCIERGE_EMAIL if set, otherwise the earliest admin.
 */
export async function conciergeUserId() {
  if (process.env.CONCIERGE_EMAIL) {
    const u = await db.user.findUnique({ where: { email: process.env.CONCIERGE_EMAIL }, select: { id: true } });
    if (u) return u.id;
  }
  const admin = await db.profile.findFirst({ where: { roles: { has: "ADMIN" } }, orderBy: { createdAt: "asc" } });
  return admin?.userId ?? null;
}

/** A hub owner asks for an intro to a partner, optionally for a plan step. */
export async function requestIntro(input: { fromUserId: string; hubId: string; partnerId: string; planStepId: string | null; note: string }) {
  const [hub, partner] = await Promise.all([
    db.hub.findUnique({ where: { id: input.hubId } }),
    db.partner.findUnique({ where: { id: input.partnerId } }),
  ]);
  if (!hub || hub.ownerId !== input.fromUserId) return { ok: false as const, message: "Pick one of your own hubs." };
  if (!partner) return { ok: false as const, message: "That partner doesn't exist." };
  if (partner.claimedById === input.fromUserId) return { ok: false as const, message: "That's your own firm." };
  const step = input.planStepId ? await db.planStep.findFirst({ where: { id: input.planStepId, hubId: hub.id } }) : null;

  const existing = await db.signal.findFirst({
    where: { kind: "PARTNER_INTRO", hubId: hub.id, partnerId: partner.id, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) return { ok: false as const, message: `You've already asked ${partner.name} about ${hub.name}.` };

  const toUserId = partner.claimedById ?? (await conciergeUserId());
  if (!toUserId) return { ok: false as const, message: "Intros aren't set up yet. An admin needs to exist." };

  const signal = await db.signal.create({
    data: {
      kind: "PARTNER_INTRO",
      fromUserId: input.fromUserId,
      toUserId,
      hubId: hub.id,
      partnerId: partner.id,
      planStepId: step?.id ?? null,
      note: input.note,
    },
    include: { fromUser: true, toUser: true },
  });
  await sendEmail({
    to: signal.toUser.email,
    subject: `Intro request: ${signal.fromUser.name} → ${partner.name}`,
    text: [
      `${signal.fromUser.name} (${hub.name}) would like an intro to ${partner.name}.`,
      step ? `For their plan step: ${step.title}` : null,
      `"${input.note}"`,
      partner.claimedById ? null : `You're receiving this as SELF's concierge because ${partner.name} hasn't claimed their profile.`,
      `Accept or decline: ${appUrl()}/connections`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
  return { ok: true as const };
}

/**
 * Called when an intro is accepted: the "intro email to both sides". The
 * builder gets the firm's details; the firm's intro address gets the builder's.
 */
export async function sendIntroEmails(signalId: string) {
  const s = await db.signal.findUniqueOrThrow({
    where: { id: signalId },
    include: { partner: true, hub: true, planStep: true, fromUser: { include: { profile: true } } },
  });
  if (!s.partner) return;
  const builder = [s.fromUser.name, s.fromUser.profile?.contactEmail, s.fromUser.profile?.contactLink].filter(Boolean).join("\n");
  await Promise.all([
    sendEmail({
      to: s.fromUser.email,
      subject: `Intro: you and ${s.partner.name}`,
      text: `${s.partner.name} is expecting you.\n\n${s.partner.contactEmail}${s.partner.website ? `\n${s.partner.website}` : ""}\n\n${appUrl()}/connections`,
    }),
    sendEmail({
      to: s.partner.contactEmail,
      subject: `Intro from SELF: ${s.fromUser.name} of ${s.hub?.name}`,
      text: [
        `Meet ${s.fromUser.name}, building ${s.hub?.name}${s.hub?.oneLiner ? `: ${s.hub.oneLiner}` : ""}.`,
        s.planStep ? `They're working on: ${s.planStep.title}` : null,
        `In their words: "${s.note}"`,
        `Reach them at:\n${builder}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    }),
  ]);
}

/**
 * The firm's contact for a builder: only after an accepted intro between one
 * of the builder's hubs and this partner. The partner-side equivalent of
 * contactsFor().
 */
export async function partnerContactsFor(viewerId: string, partnerIds: string[]) {
  if (!partnerIds.length) return new Map<string, { email: string; website: string | null }>();
  const accepted = await db.signal.findMany({
    where: { kind: "PARTNER_INTRO", status: "ACCEPTED", fromUserId: viewerId, partnerId: { in: partnerIds } },
    select: { partner: { select: { id: true, contactEmail: true, website: true } } },
  });
  return new Map(accepted.filter((a) => a.partner).map((a) => [a.partner!.id, { email: a.partner!.contactEmail, website: a.partner!.website }]));
}
