import "server-only";
import { notFound } from "next/navigation";
import { db } from "./db";
import { conciergeUserId } from "./network";
import { requireOnboarded } from "./session";

/**
 * Admin pages and actions. Non-admins get a 404, the same as a workspace
 * they can't see: the admin area doesn't announce itself.
 */
export async function requireAdmin() {
  const viewer = await requireOnboarded();
  if (!viewer.profile.roles.includes("ADMIN")) notFound();
  return viewer;
}

export async function setWorkspaceFeatured(workspaceId: string, featured: boolean) {
  await db.workspace.update({ where: { id: workspaceId }, data: { featured, featuredAt: featured ? new Date() : null } });
}

export async function setPartnerFeatured(partnerId: string, featured: boolean) {
  await db.partner.update({ where: { id: partnerId }, data: { featured } });
}

/**
 * Link a PARTNER user to a firm profile (or unlink with null). A person
 * manages one firm, so linking moves them off any other. Intros still
 * waiting for an answer move with the profile: to the new manager, or back
 * to SELF's concierge when unlinked.
 */
export async function setPartnerManager(partnerId: string, userId: string | null) {
  if (userId) {
    const profile = await db.profile.findUnique({ where: { userId }, select: { roles: true } });
    if (!profile?.roles.includes("PARTNER")) return { ok: false as const, message: "Only people with the Partner role can manage a firm." };
  }
  const concierge = await conciergeUserId();
  const answerer = userId ?? concierge;
  await db.$transaction(async (tx) => {
    if (userId) {
      const previous = await tx.partner.findUnique({ where: { claimedById: userId }, select: { id: true } });
      if (previous && previous.id !== partnerId) {
        await tx.partner.update({ where: { id: previous.id }, data: { claimedById: null } });
        if (concierge) {
          await tx.signal.updateMany({ where: { kind: "PARTNER_INTRO", partnerId: previous.id, status: "PENDING" }, data: { toUserId: concierge } });
        }
      }
    }
    await tx.partner.update({ where: { id: partnerId }, data: { claimedById: userId } });
    if (answerer) {
      await tx.signal.updateMany({ where: { kind: "PARTNER_INTRO", partnerId, status: "PENDING" }, data: { toUserId: answerer } });
    }
  });
  return { ok: true as const };
}

/** Start of the UTC day `daysAgo` days back. */
export function utcDayStart(daysAgo = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}
