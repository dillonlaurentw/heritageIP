import "server-only";
import { areaSectionAgent, runAgent, workspaceBriefing } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { readSections, writeSection } from "./area-doc";
import { AREA_KEYS, AREAS, areaSystemKey, type AreaKey } from "./areas";
import { blocksToText } from "./blocks";
import { resetCollab } from "./collab";
import { db } from "./db";
import { insertPage, pageHref } from "./pages";
import type { Viewer } from "./session";
import { logActivity, requireWorkspaceRole } from "./workspaces";

type Ws = { id: string; slug: string; name: string };

async function areaPage(workspaceId: string, key: AreaKey) {
  return db.page.findUnique({
    where: { workspaceId_systemKey: { workspaceId, systemKey: areaSystemKey(key) } },
    select: { id: true, content: true, archivedAt: true },
  });
}

/** Unfinished and finished plan steps, with needs and whether anyone has been asked about them. */
async function planSteps(workspaceId: string) {
  const plan = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId, systemKey: "gamePlan" } }, select: { id: true, archivedAt: true } });
  if (!plan || plan.archivedAt) return [];
  const [rows, asked] = await Promise.all([
    db.page.findMany({ where: { parentId: plan.id, kind: "ROW", archivedAt: null }, orderBy: { position: "asc" }, select: { id: true, title: true, props: true } }),
    db.signal.findMany({ where: { workspaceId, pageId: { not: null }, status: { in: ["PENDING", "ACCEPTED"] } }, select: { pageId: true } }),
  ]);
  const askedIds = new Set(asked.map((a) => a.pageId));
  return rows.map((r) => {
    const p = (r.props ?? {}) as { status?: string; needs?: string[]; stage?: string };
    return { id: r.id, title: r.title, done: p.status === "done", needs: p.needs ?? [], stage: p.stage ?? null, asked: askedIds.has(r.id) };
  });
}

/** The eight cards on "Help by area": a line about where each stands, and whether it needs you. */
export async function areaCards(ws: Ws) {
  const [pages, steps, partnerCounts, mentors] = await Promise.all([
    db.page.findMany({
      where: { workspaceId: ws.id, systemKey: { in: AREA_KEYS.map(areaSystemKey) }, archivedAt: null },
      select: { systemKey: true, content: true },
    }),
    planSteps(ws.id),
    Promise.all(AREA_KEYS.map((k) => (AREAS[k].partnerCategories.length ? db.partner.count({ where: { categories: { hasSome: AREAS[k].partnerCategories } } }) : 0))),
    Promise.all(
      AREA_KEYS.map((k) =>
        AREAS[k].mentorFocus.length ? db.profile.count({ where: { roles: { has: "MENTOR" }, mentorOpen: true, focusAreas: { hasSome: AREAS[k].mentorFocus } } }) : 0,
      ),
    ),
  ]);
  const cards = AREA_KEYS.map((k, i) => {
    const a = AREAS[k];
    const page = pages.find((p) => p.systemKey === areaSystemKey(k));
    const sections = readSections(page?.content, a.sections.map((s) => s.title));
    const written = Object.values(sections).filter((t) => t.trim()).length;
    const mine = steps.filter((s) => s.needs.some((n) => a.needs.includes(n as never)));
    const open = mine.filter((s) => !s.done);
    const waiting = open.filter((s) => !s.asked);
    const now =
      written === 0 && open.length === 0
        ? a.line
        : [
            written === 0 ? "Nothing written yet." : written === a.sections.length ? "Every section written." : `${written} of ${a.sections.length} sections written.`,
            open.length ? `${open.length} open ${open.length === 1 ? "step" : "steps"} in the plan${waiting.length ? `, ${waiting.length} with nobody asked yet` : ""}.` : null,
          ]
            .filter(Boolean)
            .join(" ");
    const people = [
      partnerCounts[i] ? `${partnerCounts[i]} ${partnerCounts[i] === 1 ? "partner" : "partners"}` : null,
      mentors[i] ? `${mentors[i]} ${mentors[i] === 1 ? "advisor" : "advisors"}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return { key: k, name: a.name, mark: a.mark, now, people, waiting: waiting.length, unwritten: written < a.sections.length };
  });
  // Orange means "needs you": flag only the one area with the most steps nobody has been asked about.
  const top = cards.filter((c) => c.unwritten).reduce<(typeof cards)[number] | null>((best, c) => (c.waiting > (best?.waiting ?? 0) ? c : best), null);
  return cards.map((c) => ({ key: c.key, name: c.name, mark: c.mark, now: c.now, people: c.people, needsYou: c.key === top?.key }));
}

/** Everything the area page shows: sections, its plan steps, and the people who do this work. */
export async function loadArea(ws: Ws, key: AreaKey) {
  const a = AREAS[key];
  const [page, steps, partners, mentors, team, roles] = await Promise.all([
    areaPage(ws.id, key),
    planSteps(ws.id),
    a.partnerCategories.length
      ? db.partner.findMany({
          where: { categories: { hasSome: a.partnerCategories } },
          orderBy: [{ featured: "desc" }, { name: "asc" }],
          take: 4,
          select: { slug: true, name: true, tagline: true },
        })
      : [],
    a.mentorFocus.length
      ? db.profile.findMany({
          where: { roles: { has: "MENTOR" }, mentorOpen: true, focusAreas: { hasSome: a.mentorFocus } },
          take: 3,
          select: { userId: true, headline: true, user: { select: { name: true } } },
        })
      : [],
    db.workspaceMember.findMany({ where: { workspaceId: ws.id }, select: { userId: true, title: true, user: { select: { name: true } } } }),
    key === "hiring"
      ? db.page.findMany({ where: { workspaceId: ws.id, kind: "ROW", archivedAt: null, parent: { systemKey: "roles" } }, select: { id: true, title: true, props: true } })
      : [],
  ]);
  const live = page && !page.archivedAt ? page : null;
  const sections = readSections(live?.content, a.sections.map((s) => s.title));
  const owners = team.filter((m) => m.title && a.titleWords.some((w) => m.title!.toLowerCase().includes(w)));
  return {
    area: a,
    pageHref: live ? pageHref(ws.slug, live.id) : null,
    sections: a.sections.map((s) => ({ ...s, text: sections[s.title] ?? "" })),
    steps: steps.filter((s) => s.needs.some((n) => a.needs.includes(n as never))).map((s) => ({ ...s, href: pageHref(ws.slug, s.id) })),
    partners,
    mentors: mentors.map((m) => ({ id: m.userId, name: m.user.name, headline: m.headline })),
    team: owners.map((m) => ({ id: m.userId, name: m.user.name, title: m.title! })),
    openRoles: roles
      .filter((r) => {
        const s = (r.props as Record<string, unknown> | null)?.state;
        return !s || s === "open";
      })
      .map((r) => ({ id: r.id, title: r.title })),
  };
}

/** A draft of one section. A proposal only: nothing is saved. */
export async function proposeAreaSection(viewer: Viewer, ws: Ws, key: AreaKey, sectionKey: string, steer?: string) {
  await requireWorkspaceRole(ws.id, viewer, "MEMBER");
  const a = AREAS[key];
  const section = a.sections.find((s) => s.key === sectionKey);
  if (!section) return { ok: false as const, message: "That section doesn't exist." };
  const page = await areaPage(ws.id, key);
  const sections = readSections(page && !page.archivedAt ? page.content : null, a.sections.map((s) => s.title));
  return runAgent(
    areaSectionAgent,
    {
      area: { key, name: a.name, brief: a.line },
      section: { title: section.title, hint: section.hint },
      briefing: await workspaceBriefing(ws.id),
      others: a.sections.filter((s) => s.key !== sectionKey).map((s) => ({ title: s.title, text: sections[s.title] ?? "" })),
      current: sections[section.title] ?? "",
      steer,
    },
    { userId: viewer.user.id, workspaceId: ws.id },
  );
}

/** "Use this" or "Save": writes one section into the area's page (creating the page the first time). */
export async function saveAreaSection(viewer: Viewer, ws: Ws, key: AreaKey, sectionKey: string, text: string) {
  await requireWorkspaceRole(ws.id, viewer, "MEMBER");
  const a = AREAS[key];
  const section = a.sections.find((s) => s.key === sectionKey);
  if (!section) return { ok: false as const, message: "That section doesn't exist." };
  const body = text.trim();
  if (body.length > 4000) return { ok: false as const, message: "Keep a section under 4,000 characters; longer things belong in their own page." };
  const titles = a.sections.map((s) => s.title);
  const page = await areaPage(ws.id, key);
  if (page) {
    await db.pageVersion.create({ data: { pageId: page.id, title: a.name, content: (page.content ?? []) as Prisma.InputJsonValue, createdById: viewer.user.id } });
    const content = writeSection(page.content, titles, section.title, body);
    await db.page.update({
      where: { id: page.id },
      data: { content: content as Prisma.InputJsonValue, text: blocksToText(content), archivedAt: null, updatedById: viewer.user.id },
    });
    await resetCollab(page.id);
    await logActivity(ws.id, viewer.user.id, "page.edited", page.id, { title: a.name });
  } else {
    const content = writeSection([], titles, section.title, body);
    const created = await insertPage({ workspaceId: ws.id, title: a.name, content, systemKey: areaSystemKey(key) }, viewer.user.id);
    await logActivity(ws.id, viewer.user.id, "page.created", created.id, { title: a.name });
  }
  return { ok: true as const };
}
