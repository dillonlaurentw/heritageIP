import "server-only";
import { matchAgent, runAgent } from "@/agents";
import { builderContext } from "./builder";
import { builderBlock } from "@/agents/context";
import { db } from "./db";
import { orderForChair } from "./message-rules";
import { notifyUsers } from "./notify";
import type { Viewer } from "./session";
import { readThesis } from "./thesis";
import { roleIn } from "./workspaces";

type Fail = { ok: false; message: string };

export type Chair = { key: string; title: string; kind: "cofounder" | "advisor"; detail: string | null; roleId: string | null };

/** "role:<rowId>", "need:COFOUNDER" or "need:MENTOR" → the open chair it names in this company. */
export async function chairFor(workspaceId: string, key: string | undefined): Promise<Chair | null> {
  const k = key || "need:COFOUNDER";
  if (k === "need:COFOUNDER") return { key: k, title: "A co-founder", kind: "cofounder", detail: null, roleId: null };
  if (k === "need:MENTOR") return { key: k, title: "An advisor", kind: "advisor", detail: null, roleId: null };
  const m = /^role:(.+)$/.exec(k);
  if (!m) return null;
  const row = await db.page.findFirst({
    where: { id: m[1], workspaceId, kind: "ROW", archivedAt: null, parent: { systemKey: "roles" } },
    select: { id: true, title: true, text: true, props: true },
  });
  if (!row) return null;
  const p = (row.props ?? {}) as Record<string, unknown>;
  if (p.state && p.state !== "open") return null;
  return {
    key: k,
    title: row.title || "An open role",
    kind: p.commitment === "advisor" ? "advisor" : "cofounder",
    detail: row.text?.slice(0, 600) || null,
    roleId: row.id,
  };
}

/** Open chairs a founder can find matches for: open roles, plus the generic co-founder and advisor chairs. */
export async function openChairs(workspaceId: string): Promise<Chair[]> {
  const rows = await db.page.findMany({
    where: { workspaceId, kind: "ROW", archivedAt: null, parent: { systemKey: "roles" } },
    orderBy: { position: "asc" },
    select: { id: true, title: true, props: true },
  });
  const roles: Chair[] = rows
    .filter((r) => {
      const s = (r.props as Record<string, unknown> | null)?.state;
      return !s || s === "open";
    })
    .map((r) => ({
      key: `role:${r.id}`,
      title: r.title || "An open role",
      kind: (r.props as Record<string, unknown> | null)?.commitment === "advisor" ? "advisor" : "cofounder",
      detail: null,
      roleId: r.id,
    }));
  return [...roles, { key: "need:COFOUNDER", title: "A co-founder", kind: "cofounder", detail: null, roleId: null }, { key: "need:MENTOR", title: "An advisor", kind: "advisor", detail: null, roleId: null }];
}

export type Candidate = {
  id: string;
  name: string;
  headline: string | null;
  location: string | null;
  strengths: string;
  buildingToward: string | null;
  note: string;
  focusAreas: string[];
};

/**
 * People who might fit a chair. Co-founder chairs: builders who turned on
 * "open to matches". Advisor chairs: mentors taking requests. Never people
 * already in the company. Returns only the fields those people agreed to show.
 */
export async function candidatesFor(workspaceId: string, viewer: Viewer, chair: Chair): Promise<Candidate[]> {
  const members = await db.workspaceMember.findMany({ where: { workspaceId }, select: { userId: true } });
  const exclude = [viewer.user.id, ...members.map((m) => m.userId)];
  const profiles = await db.profile.findMany({
    where: {
      userId: { notIn: exclude },
      onboardedAt: { not: null },
      ...(chair.kind === "advisor" ? { roles: { has: "MENTOR" }, mentorOpen: true } : { roles: { has: "BUILDER" }, openToMatches: true }),
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: {
      userId: true,
      headline: true,
      location: true,
      strengths: true,
      buildingToward: true,
      openToMatchesNote: true,
      mentorNote: true,
      focusAreas: true,
      user: { select: { name: true } },
    },
  });
  const people: Candidate[] = profiles.map((p) => ({
    id: p.userId,
    name: p.user.name,
    headline: p.headline,
    location: p.location,
    strengths: chair.kind === "advisor" ? p.focusAreas.join(", ") : (p.strengths ?? ""),
    buildingToward: chair.kind === "advisor" ? null : p.buildingToward,
    note: (chair.kind === "advisor" ? p.mentorNote : p.openToMatchesNote) ?? "",
    focusAreas: p.focusAreas,
  }));
  const need = [chair.title, chair.detail ?? "", viewer.profile.gaps ?? ""].join(" ");
  return orderForChair(need, people);
}

/** Why this person might fit, in words. Cached per company, person and chair; regenerated only on request. */
export async function explainMatch(viewer: Viewer, workspace: { id: string; name: string; oneLiner: string | null }, chair: Chair, person: Candidate, fresh = false) {
  const where = { workspaceId_userId_chairKey: { workspaceId: workspace.id, userId: person.id, chairKey: chair.key } };
  if (!fresh) {
    const cached = await db.matchNote.findUnique({ where });
    if (cached) return { ok: true as const, fit: cached.fit, askAbout: cached.askAbout, demo: cached.demo };
  }
  const thesis = await readThesis(workspace.id);
  const b = builderContext(viewer);
  const res = await runAgent(
    matchAgent,
    {
      company: { name: workspace.name, oneLiner: workspace.oneLiner, thesis: thesis?.statement ?? null },
      chair: { title: chair.title, kind: chair.kind, detail: chair.detail },
      founder: { name: viewer.user.name, self: b.self ?? builderBlock(b) },
      person: {
        name: person.name,
        headline: person.headline,
        location: person.location,
        strengths: person.strengths || null,
        buildingToward: person.buildingToward,
        note: person.note || null,
        focusAreas: person.focusAreas,
      },
    },
    { userId: viewer.user.id, workspaceId: workspace.id },
  );
  if (!res.ok) return res;
  await db.matchNote.upsert({
    where,
    create: { workspaceId: workspace.id, userId: person.id, chairKey: chair.key, fit: res.output.fit, askAbout: res.output.askAbout, demo: res.demo },
    update: { fit: res.output.fit, askAbout: res.output.askAbout, demo: res.demo, createdAt: new Date() },
  });
  return { ok: true as const, fit: res.output.fit, askAbout: res.output.askAbout, demo: res.demo };
}

/** Where the viewer's company stands with this person: nothing yet, invited, or connected. */
export async function inviteState(workspaceId: string, personId: string) {
  const s = await db.signal.findFirst({
    where: { workspaceId, kind: { in: ["ROLE_INVITE", "MENTOR_REQUEST"] }, toUserId: personId, status: { in: ["PENDING", "ACCEPTED"] } },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });
  return s?.status ?? null;
}

/**
 * "Start a conversation": a ROLE_INVITE to someone open to matches. When they
 * say yes, contacts are swapped (as with every signal) and a conversation opens.
 */
export async function inviteToChair(viewer: Viewer, workspaceId: string, chairKey: string, personId: string, note: string): Promise<{ ok: true } | Fail> {
  const role = await roleIn(workspaceId, viewer.user.id);
  if (!role || role === "GUEST") return { ok: false, message: "Only members of the company can invite people." };
  const ws = await db.workspace.findUnique({ where: { id: workspaceId }, select: { id: true, name: true, kind: true } });
  if (!ws || ws.kind !== "TEAM") return { ok: false, message: "That company doesn't exist." };
  const chair = await chairFor(ws.id, chairKey);
  if (!chair || chair.kind !== "cofounder") return { ok: false, message: "That chair isn't open any more." };
  const person = await db.profile.findUnique({ where: { userId: personId }, select: { openToMatches: true, user: { select: { name: true } } } });
  if (!person?.openToMatches) return { ok: false, message: "They aren't taking new conversations right now." };
  if (await roleIn(ws.id, personId)) return { ok: false, message: "They're already in this company." };
  if (await inviteState(ws.id, personId)) return { ok: false, message: "You've already reached out to them." };
  const text = note.trim();
  if (text.length < 10) return { ok: false, message: "Say a little about why you're reaching out." };
  if (text.length > 1000) return { ok: false, message: "Keep it under 1,000 characters." };
  await db.signal.create({
    data: { kind: "ROLE_INVITE", fromUserId: viewer.user.id, toUserId: personId, workspaceId: ws.id, pageId: chair.roleId, note: text },
  });
  await notifyUsers({
    userIds: [personId],
    actorId: viewer.user.id,
    kind: "SIGNAL",
    text: `${viewer.user.name} from ${ws.name} would like to talk about ${chair.roleId ? `“${chair.title}”` : "working together"}`,
    href: "/network/connections",
    email: { subject: `${viewer.user.name} would like to talk`, body: `${viewer.user.name} from ${ws.name} reached out on SELF:\n\n"${text}"\n\nSay yes and you can message each other.` },
  });
  return { ok: true };
}
