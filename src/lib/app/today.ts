import "server-only";
import { db } from "../db";
import type { RingNode } from "../ring";
import type { Viewer } from "../session";
import { loadCircle } from "./circles";
import { myHours } from "./hours";

/** The app's home: your ring of peers and advisors, this week, and what needs you. */
export async function today(viewer: Viewer) {
  const uid = viewer.user.id;
  const [circle, hours, mentorsYes, pending, company] = await Promise.all([
    loadCircle(uid),
    myHours(uid),
    db.signal.findMany({
      where: { kind: "MENTOR_REQUEST", fromUserId: uid, status: "ACCEPTED" },
      select: { toUser: { select: { id: true, name: true } } },
    }),
    db.signal.count({ where: { toUserId: uid, status: "PENDING" } }),
    db.workspaceMember.findFirst({
      where: { userId: uid, role: { in: ["OWNER", "ADMIN"] }, workspace: { kind: "TEAM" } },
      orderBy: { joinedAt: "asc" },
      select: { workspace: { select: { id: true, name: true } } },
    }),
  ]);

  const nodes: RingNode[] = [];
  for (const m of circle?.members ?? []) {
    if (m.id === uid) continue;
    nodes.push({ id: `p-${m.id}`, theme: "COFOUNDERS", kind: "person", state: m.checkedIn ? "linked" : "pending", name: m.name, note: m.checkedIn ? "checked in" : "not yet this week" });
  }
  const advisors = new Map<string, string>();
  for (const s of mentorsYes) advisors.set(s.toUser.id, s.toUser.name);
  for (const h of hours) if (h.role === "founder") advisors.set(h.mentorId, h.with);
  for (const [id, name] of advisors) nodes.push({ id: `a-${id}`, theme: "ADVISORS", kind: "person", state: "linked", name, note: "advisor" });

  let steps: { title: string; stage: string | null }[] = [];
  if (company) {
    const plan = await db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: company.workspace.id, systemKey: "gamePlan" } }, select: { id: true } });
    if (plan) {
      const rows = await db.page.findMany({ where: { parentId: plan.id, kind: "ROW", archivedAt: null }, orderBy: { position: "asc" }, select: { title: true, props: true } });
      steps = rows
        .map((r) => ({ r, p: (r.props ?? {}) as { status?: string; stage?: string } }))
        .filter(({ p }) => p.status !== "done")
        .slice(0, 3)
        .map(({ r, p }) => ({ title: r.title, stage: p.stage ?? null }));
    }
  }

  const repliesToMe = circle?.checkIns.find((c) => c.userId === uid)?.replies.filter((r) => r.authorId !== uid) ?? [];
  const needs: { key: string; title: string; detail: string; to: string }[] = [];
  if (circle && !circle.mine) needs.push({ key: "checkin", title: "Check in with your circle", detail: "What you did, where you're stuck, what you need.", to: "/checkin" });
  for (const r of repliesToMe.slice(-2)) needs.push({ key: `r-${r.id}`, title: `${r.author.split(" ")[0]} replied to your check-in`, detail: r.text, to: "/circle" });
  if (circle && circle.checkIns.length >= 2 && !circle.summary) needs.push({ key: "summary", title: "This week's note is ready to write", detail: `${circle.checkIns.length} people have checked in.`, to: "/circle" });
  if (pending) needs.push({ key: "requests", title: `${pending} ${pending === 1 ? "request is" : "requests are"} waiting for you`, detail: "Answer them on the web for now.", to: "/you" });

  return {
    name: viewer.user.name,
    circle: circle ? { name: circle.name, members: circle.members.length, checkedIn: circle.checkIns.length, mine: !!circle.mine } : null,
    ring: nodes,
    hours,
    needs,
    company: company ? { name: company.workspace.name, steps } : null,
  };
}
