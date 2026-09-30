import "server-only";
import { weekOf } from "../app-rules";
import { db } from "../db";
import type { RingNode } from "../ring";
import type { Viewer } from "../session";
import { circleUnread } from "./circles";
import { wroteToday } from "./journal";
import { incomingRequests } from "./mentors";

/** The app's home: your ring (circle and mentors), what needs you, and whether you've written today. */
export async function today(viewer: Viewer, now = new Date()) {
  const uid = viewer.user.id;
  const [seat, unread, wrote, mentorsYes, asks, otherPending, company, hostWaiting, picked] = await Promise.all([
    db.circleMember.findUnique({
      where: { userId: uid },
      select: { circle: { select: { name: true, members: { select: { user: { select: { id: true, name: true } } } } } }, circleId: true },
    }),
    circleUnread(uid),
    wroteToday(uid, now),
    db.signal.findMany({ where: { kind: "MENTOR_REQUEST", fromUserId: uid, status: "ACCEPTED" }, select: { toUser: { select: { id: true, name: true } } } }),
    incomingRequests(uid),
    db.signal.count({ where: { toUserId: uid, status: "PENDING", kind: "ROLE_INTEREST" } }),
    db.workspaceMember.findFirst({
      where: { userId: uid, role: { in: ["OWNER", "ADMIN"] }, workspace: { kind: "TEAM" } },
      orderBy: { joinedAt: "asc" },
      select: { workspace: { select: { id: true, name: true } } },
    }),
    db.opportunityRequest.count({ where: { status: "PENDING", opportunity: { hostId: uid, startsAt: { gt: now } } } }),
    db.opportunityRequest.findMany({
      where: { userId: uid, status: "PICKED", answeredAt: { gt: new Date(now.getTime() - 7 * 86_400_000) }, opportunity: { startsAt: { gt: now } } },
      select: { id: true, opportunity: { select: { id: true, title: true, place: true, host: { select: { name: true } } } } },
    }),
  ]);

  // Ring: peers in your circle (dark if they've spoken up this week), and mentors who said yes.
  const nodes: RingNode[] = [];
  if (seat) {
    const spoke = await db.circleMessage.findMany({
      where: { circleId: seat.circleId, authorId: { not: null }, createdAt: { gte: weekOf(now) } },
      distinct: ["authorId"],
      select: { authorId: true },
    });
    const active = new Set(spoke.map((s) => s.authorId));
    for (const { user } of seat.circle.members) {
      if (user.id === uid) continue;
      nodes.push({ id: `p-${user.id}`, theme: "COFOUNDERS", kind: "person", state: active.has(user.id) ? "linked" : "pending", name: user.name, note: active.has(user.id) ? "talking this week" : "quiet this week" });
    }
  }
  for (const s of mentorsYes) nodes.push({ id: `a-${s.toUser.id}`, theme: "ADVISORS", kind: "person", state: "linked", name: s.toUser.name, note: "mentor" });
  // Partners you asked for an intro, and backers interested in you (a yes is dark, waiting is grey).
  const [intros, backers] = await Promise.all([
    db.signal.findMany({ where: { kind: "PARTNER_INTRO", fromUserId: uid, status: { in: ["PENDING", "ACCEPTED"] } }, select: { status: true, partner: { select: { id: true, name: true } } } }),
    db.signal.findMany({ where: { kind: "BACKER_INTEREST", toUserId: uid, status: { in: ["PENDING", "ACCEPTED"] } }, select: { status: true, fromUser: { select: { id: true, name: true } } } }),
  ]);
  for (const s of intros)
    if (s.partner) nodes.push({ id: `f-${s.partner.id}`, theme: "PARTNERS", kind: "firm", state: s.status === "ACCEPTED" ? "linked" : "pending", name: s.partner.name, note: s.status === "ACCEPTED" ? "introduced" : "intro asked" });
  for (const s of backers)
    nodes.push({ id: `b-${s.fromUser.id}`, theme: "CAPITAL", kind: "person", state: s.status === "ACCEPTED" ? "linked" : "pending", name: s.fromUser.name, note: s.status === "ACCEPTED" ? "talking" : "interested" });

  const needs: { key: string; title: string; detail: string; to: string }[] = [];
  for (const a of asks.slice(0, 3)) needs.push({ key: `ask-${a.id}`, title: `${a.from.name.split(" ")[0]} ${a.asks}`, detail: a.note, to: "/requests" });
  if (hostWaiting) needs.push({ key: "hosting", title: `${hostWaiting} ${hostWaiting === 1 ? "person wants" : "people want"} to come to what you're hosting`, detail: "Pick who comes, or say not this time.", to: "/hosting" });
  for (const p of picked) needs.push({ key: `in-${p.id}`, title: `You're in: ${p.opportunity.title}`, detail: `${p.opportunity.place} · hosted by ${p.opportunity.host.name}`, to: `/opportunity/${p.opportunity.id}` });
  if (unread) needs.push({ key: "circle", title: `${unread} new in ${seat?.circle.name ?? "your circle"}`, detail: "Your circle has been talking.", to: "/circle" });
  if (otherPending) needs.push({ key: "web", title: `${otherPending} role ${otherPending === 1 ? "request is" : "requests are"} waiting`, detail: "Answer them on the web for now.", to: "/you" });

  let steps: string[] = [];
  if (company) {
    const plan = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: company.workspace.id, systemKey: "gamePlan" } }, select: { id: true } });
    if (plan) {
      const rows = await db.page.findMany({ where: { parentId: plan.id, kind: "ROW", archivedAt: null }, orderBy: { position: "asc" }, select: { title: true, props: true } });
      steps = rows
        .filter((r) => ((r.props ?? {}) as { status?: string }).status !== "done")
        .slice(0, 3)
        .map((r) => r.title);
    }
  }

  return {
    name: viewer.user.name,
    wroteToday: wrote,
    circle: seat ? { name: seat.circle.name, unread } : null,
    ring: nodes,
    needs,
    company: company ? { name: company.workspace.name, steps } : null,
  };
}
