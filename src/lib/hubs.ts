import "server-only";
import { notFound } from "next/navigation";
import type { BuilderContext } from "@/agents/context";
import { db } from "./db";
import type { Viewer } from "./session";

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "hub"
  );
}

export async function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await db.hub.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

export const hubNumber = (n: number) => `Hub ${String(n).padStart(2, "0")}`;

export const STAGE_LABEL: Record<string, string> = {
  IDEA: "Idea",
  THESIS: "Thesis",
  PLAN: "Game plan",
  BUILDING: "Building",
  LAUNCHED: "Launched",
};

/**
 * Load a hub the viewer may edit. For now that's the owner only; team members
 * join in Phase 4. Anything else is a 404 (don't reveal that it exists).
 */
export async function getOwnedHub(slug: string, viewer: Viewer) {
  const hub = await db.hub.findUnique({ where: { slug }, include: { thesis: true } });
  if (!hub || hub.ownerId !== viewer.user.id) notFound();
  return hub;
}

/**
 * Load a hub the viewer can SEE: its owner or a team member. Pages use
 * `isOwner` to hide editing. Owner-only pages keep using getOwnedHub.
 */
export async function getHubAccess(slug: string, viewer: Viewer) {
  const hub = await db.hub.findUnique({ where: { slug }, include: { thesis: true } });
  if (!hub) notFound();
  const isOwner = hub.ownerId === viewer.user.id;
  const membership = isOwner
    ? null
    : await db.hubMember.findUnique({ where: { hubId_userId: { hubId: hub.id, userId: viewer.user.id } } });
  if (!isOwner && !membership) notFound();
  return { hub, isOwner, membership };
}

/** Same check for server actions, which receive an id rather than a slug. */
export async function requireOwnedHubId(hubId: string, viewer: Viewer) {
  const hub = await db.hub.findUnique({ where: { id: hubId }, include: { thesis: true } });
  if (!hub || hub.ownerId !== viewer.user.id) throw new Error("Not your hub.");
  return hub;
}

const NEW_FOR_MS = 3 * 24 * 60 * 60 * 1000;

const hubCardSelect = {
  id: true,
  number: true,
  slug: true,
  name: true,
  oneLiner: true,
  stage: true,
  coverLayout: true,
  coverTone: true,
  coverImageUrl: true,
  createdAt: true,
} as const;

/** Hubs the user owns, then hubs they've joined as a team member. */
export async function listHubs(userId: string) {
  const [owned, joined] = await Promise.all([
    db.hub.findMany({ where: { ownerId: userId }, orderBy: { updatedAt: "desc" }, select: hubCardSelect }),
    db.hub.findMany({
      where: { members: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      select: { ...hubCardSelect, members: { where: { userId }, select: { role: true } } },
    }),
  ]);
  const now = Date.now();
  return [
    ...owned.map((h) => ({ ...h, memberRole: null as string | null })),
    ...joined.map(({ members, ...h }) => ({ ...h, memberRole: members[0]?.role ?? "Team" })),
  ].map((h) => ({ ...h, isNew: now - h.createdAt.getTime() < NEW_FOR_MS }));
}

export type HubCard = Awaited<ReturnType<typeof listHubs>>[number];

export function builderContext(viewer: Viewer): BuilderContext {
  const p = viewer.profile;
  return {
    name: viewer.user.name,
    headline: p.headline,
    beliefs: p.beliefs,
    workStyle: p.workStyle,
    buildingToward: p.buildingToward,
    strengths: p.strengths,
    gaps: p.gaps,
    decisionStyle: p.decisionStyle,
  };
}

/**
 * The viewer's own hubs with their open plan steps, for "ask for help"
 * forms. `relevant` flags steps whose needs match what's being asked for.
 */
export async function hubOptionsFor(userId: string, isRelevant: (needs: string[]) => boolean) {
  const hubs = await db.hub.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, name: true, planSteps: { where: { doneAt: null }, select: { id: true, title: true, needs: true } } },
  });
  return hubs.map((h) => ({
    id: h.id,
    slug: h.slug,
    name: h.name,
    steps: h.planSteps.map((st) => ({ id: st.id, title: st.title, relevant: isRelevant(st.needs) })),
  }));
}
