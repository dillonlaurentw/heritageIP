import "server-only";
import { db } from "./db";
import { sendEmail } from "./email";
import type { Viewer } from "./session";

const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const isBacker = (v: Viewer) => v.profile.roles.includes("BACKER") || v.profile.roles.includes("ADMIN");

/**
 * A backer may see a hub's teaser if the hub is discoverable, or if they
 * already have an accepted interest signal with it (so switching discovery
 * off doesn't strand existing connections).
 */
export async function canSeeTeaser(hub: { id: string; discoverable: boolean; ownerId: string }, viewer: Viewer) {
  if (hub.ownerId === viewer.user.id) return true;
  if (!isBacker(viewer)) return false;
  if (hub.discoverable) return true;
  const accepted = await db.signal.findFirst({
    where: { kind: "BACKER_INTEREST", hubId: hub.id, fromUserId: viewer.user.id, status: "ACCEPTED" },
  });
  return Boolean(accepted);
}

export async function sendBackerInterest(viewer: Viewer, hubId: string, note: string) {
  if (!isBacker(viewer)) return { ok: false as const, message: "Only backers can signal interest. Add the Backer role on your profile." };
  const hub = await db.hub.findUnique({ where: { id: hubId }, include: { owner: true } });
  if (!hub || !hub.discoverable) return { ok: false as const, message: "This hub isn't open to backers right now." };
  if (hub.ownerId === viewer.user.id) return { ok: false as const, message: "That's your own hub." };
  const existing = await db.signal.findFirst({
    where: { kind: "BACKER_INTEREST", hubId, fromUserId: viewer.user.id, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) return { ok: false as const, message: "You've already signalled interest in this hub." };

  await db.signal.create({
    data: { kind: "BACKER_INTEREST", fromUserId: viewer.user.id, toUserId: hub.ownerId, hubId, note },
  });
  await sendEmail({
    to: hub.owner.email,
    subject: `A backer is interested in ${hub.name}`,
    text: `${viewer.user.name} signalled interest in ${hub.name}.\n\n"${note}"\n\nThis is interest only; nothing is offered or committed on SELF. Accept to swap contact details, or decline: ${appUrl()}/connections`,
  });
  return { ok: true as const };
}
