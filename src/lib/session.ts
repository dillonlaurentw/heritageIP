import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { db } from "./db";
import type { Role } from "@/generated/prisma/enums";

/**
 * The signed-in person, or null. Cached per request so layouts and pages can
 * both call it without extra queries.
 */
export const getViewer = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const profile = await ensureProfile(session.user.id, session.user.email);
  return { user: session.user, profile };
});

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  return viewer;
}

/** Signed in AND finished onboarding. Most app pages use this. */
export async function requireOnboarded() {
  const viewer = await requireViewer();
  if (!viewer.profile.onboardedAt) redirect("/onboarding");
  return viewer;
}

export async function requireRole(role: Role) {
  const viewer = await requireOnboarded();
  if (!viewer.profile.roles.includes(role)) redirect("/home");
  return viewer;
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Every user gets a Profile on first sight; ADMIN_EMAILS get the ADMIN role. */
async function ensureProfile(userId: string, email: string) {
  const profile = await db.profile.upsert({
    where: { userId },
    create: { userId, contactEmail: email },
    update: {},
  });

  if (adminEmails().includes(email.toLowerCase()) && !profile.roles.includes("ADMIN")) {
    return db.profile.update({
      where: { userId },
      data: { roles: { push: "ADMIN" } },
    });
  }
  return profile;
}
