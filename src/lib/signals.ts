import "server-only";
import { db } from "./db";
import { sendEmail } from "./email";
import { nextStatus, revealsContact, type SignalAction } from "./signal-rules";

export type Contact = { email: string | null; link: string | null };

const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

/**
 * Contact details for the given people, but ONLY those who share an accepted
 * signal with the viewer. Everyone else is simply absent from the map.
 * This is the single gate for contact info in SELF.
 */
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
  const profiles = await db.profile.findMany({
    where: { userId: { in: allowed } },
    select: { userId: true, contactEmail: true, contactLink: true },
  });
  return new Map(profiles.map((p) => [p.userId, { email: p.contactEmail, link: p.contactLink }]));
}

export async function pendingIncoming(userId: string) {
  return db.signal.count({ where: { toUserId: userId, status: "PENDING" } });
}

/** A builder signals interest in a role. Validates everything server-side. */
export async function sendRoleInterest(fromUserId: string, roleId: string, note: string) {
  const role = await db.roleOpening.findUnique({ where: { id: roleId }, include: { hub: true } });
  if (!role || role.status !== "OPEN") return { ok: false as const, message: "This role isn't open any more." };
  if (role.hub.ownerId === fromUserId) return { ok: false as const, message: "That's your own hub." };
  const member = await db.hubMember.findUnique({ where: { hubId_userId: { hubId: role.hubId, userId: fromUserId } } });
  if (member) return { ok: false as const, message: "You're already on this team." };
  const existing = await db.signal.findFirst({
    where: { kind: "ROLE_INTEREST", fromUserId, roleOpeningId: roleId, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) return { ok: false as const, message: "You've already signalled interest in this role." };

  const signal = await db.signal.create({
    data: {
      kind: "ROLE_INTEREST",
      fromUserId,
      toUserId: role.hub.ownerId,
      hubId: role.hubId,
      roleOpeningId: role.id,
      planStepId: role.planStepId,
      note,
    },
    include: { fromUser: true, toUser: true },
  });
  await sendEmail({
    to: signal.toUser.email,
    subject: `${signal.fromUser.name} wants to join ${role.hub.name}`,
    text: `${signal.fromUser.name} signalled interest in "${role.title}" on ${role.hub.name}.\n\n"${note}"\n\nAccept or decline: ${appUrl()}/connections`,
  });
  return { ok: true as const, signalId: signal.id };
}

/**
 * Accept, decline or withdraw. Accepting a ROLE_INTEREST adds the sender to
 * the hub team and emails both people each other's contact details.
 */
export async function actOnSignal(signalId: string, actorId: string, action: SignalAction) {
  const signal = await db.signal.findUnique({
    where: { id: signalId },
    include: { fromUser: { include: { profile: true } }, toUser: { include: { profile: true } }, hub: true, roleOpening: true },
  });
  if (!signal) return { ok: false as const, message: "That request doesn't exist." };
  const next = nextStatus(signal, action, actorId);
  if (!next.ok) return { ok: false as const, message: next.reason };

  await db.$transaction(async (tx) => {
    // Guard against a double click racing: only update if still pending.
    const { count } = await tx.signal.updateMany({
      where: { id: signal.id, status: "PENDING" },
      data: { status: next.status, respondedAt: new Date() },
    });
    if (!count) throw new Error("Already answered.");
    if (next.status === "ACCEPTED" && signal.kind === "ROLE_INTEREST" && signal.hubId) {
      await tx.hubMember.upsert({
        where: { hubId_userId: { hubId: signal.hubId, userId: signal.fromUserId } },
        create: { hubId: signal.hubId, userId: signal.fromUserId, role: signal.roleOpening?.title ?? "Team" },
        update: {},
      });
    }
  });

  if (next.status === "ACCEPTED") {
    const about = signal.roleOpening ? `"${signal.roleOpening.title}" on ${signal.hub?.name}` : (signal.hub?.name ?? "SELF");
    const card = (u: typeof signal.fromUser) =>
      [u.name, u.profile?.contactEmail, u.profile?.contactLink].filter(Boolean).join("\n");
    await Promise.all([
      sendEmail({
        to: signal.fromUser.email,
        subject: `You're in: ${about}`,
        text: `${signal.toUser.name} said yes to ${about}. Here's how to reach them:\n\n${card(signal.toUser)}\n\n${appUrl()}/connections`,
      }),
      sendEmail({
        to: signal.toUser.email,
        subject: `You said yes to ${signal.fromUser.name}`,
        text: `Here's how to reach ${signal.fromUser.name}:\n\n${card(signal.fromUser)}\n\n${appUrl()}/connections`,
      }),
    ]);
  }
  return { ok: true as const, status: next.status };
}
