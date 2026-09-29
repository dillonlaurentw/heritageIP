import "server-only";
import { db } from "./db";
import { buildRing } from "./ring-build";
import type { RingNode, Theme } from "./ring";

/** Everything a company's ring shows, read from the database. Callers check access first. */
export async function loadRing(
  workspace: { id: string; slug: string },
  viewerId: string,
  opts: { planChairs?: boolean } = {},
): Promise<RingNode[]> {
  const [members, signals, dbs] = await Promise.all([
    db.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { joinedAt: "asc" },
      select: { userId: true, role: true, title: true, user: { select: { name: true } } },
    }),
    db.signal.findMany({
      where: { workspaceId: workspace.id, status: { in: ["PENDING", "ACCEPTED"] } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        kind: true,
        status: true,
        fromUserId: true,
        toUserId: true,
        pageId: true,
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
        partner: { select: { slug: true, name: true } },
      },
    }),
    db.page.findMany({
      where: { workspaceId: workspace.id, systemKey: { in: ["roles", "gamePlan"] }, archivedAt: null },
      select: { id: true, systemKey: true },
    }),
  ]);
  const rolesDb = dbs.find((d) => d.systemKey === "roles");
  const planDb = dbs.find((d) => d.systemKey === "gamePlan");
  const [roleRows, stepRows] = await Promise.all([
    rolesDb ? db.page.findMany({ where: { parentId: rolesDb.id, kind: "ROW", archivedAt: null }, select: { id: true, title: true, props: true } }) : [],
    planDb
      ? db.page.findMany({ where: { parentId: planDb.id, kind: "ROW", archivedAt: null }, orderBy: { position: "asc" }, select: { id: true, title: true, props: true } })
      : [],
  ]);

  const interested = new Map<string, number>();
  for (const s of signals) if (s.kind === "ROLE_INTEREST" && s.status === "PENDING" && s.pageId) interested.set(s.pageId, (interested.get(s.pageId) ?? 0) + 1);

  return buildRing({
    viewerId,
    slug: workspace.slug,
    members: members.map((m) => ({ userId: m.userId, name: m.user.name, role: m.role, title: m.title })),
    roles: roleRows
      .map((r) => ({ r, p: (r.props ?? {}) as Record<string, unknown> }))
      .filter(({ p }) => !p.state || p.state === "open")
      .map(({ r, p }) => ({
        id: r.id,
        title: r.title || "An open role",
        advisor: p.commitment === "advisor",
        href: `/w/${workspace.slug}/matches?chair=role:${r.id}`,
        interested: interested.get(r.id) ?? 0,
      })),
    signals: signals.map((s) => ({
      id: s.id,
      kind: s.kind,
      status: s.status,
      fromUserId: s.fromUserId,
      fromName: s.fromUser.name,
      toUserId: s.toUserId,
      toName: s.toUser.name,
      partner: s.partner,
      pageId: s.pageId,
    })),
    openSteps: opts.planChairs === false ? [] : stepRows
      .map((r) => ({ r, p: (r.props ?? {}) as { status?: string; needs?: string[] } }))
      .filter(({ p }) => p.status !== "done")
      .map(({ r, p }) => ({ id: r.id, title: r.title, needs: p.needs ?? [] })),
  });
}

/** Where each quarter's label leads for a company. */
export function themeLinks(slug: string): Partial<Record<Theme, string>> {
  return {
    COFOUNDERS: `/network/roles?ws=${slug}`,
    PARTNERS: `/network/partners?ws=${slug}`,
    ADVISORS: `/network/mentors?ws=${slug}`,
    CAPITAL: `/w/${slug}/backers`,
  };
}
