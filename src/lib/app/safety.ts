import "server-only";
import { hasOtherOwner, heirFor, REPORT_REASONS, type ReportReason } from "../app-rules";
import { db } from "../db";
import type { Viewer } from "../session";

type Fail = { ok: false; message: string };

/**
 * Safety: block, report, leave. A block works both ways (no messages, no
 * requests, hidden from each other's lists) and is never shown to the person
 * blocked: they just see "not taking requests". Reports copy the reported
 * text so an admin can judge it. Journals can never be reported: they're private.
 */

/** Everyone the viewer has blocked or been blocked by. */
export async function blockedIds(userId: string): Promise<Set<string>> {
  const rows = await db.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] }, select: { blockerId: true, blockedId: true } });
  return new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)));
}

export async function blockedBetween(a: string, b: string) {
  return (await db.block.count({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } })) > 0;
}

export async function block(viewer: Viewer, userId: string): Promise<{ ok: true } | Fail> {
  if (userId === viewer.user.id) return { ok: false, message: "That's you." };
  if (!(await db.user.count({ where: { id: userId } }))) return { ok: false, message: "That person doesn't exist." };
  await db.block.upsert({ where: { blockerId_blockedId: { blockerId: viewer.user.id, blockedId: userId } }, create: { blockerId: viewer.user.id, blockedId: userId }, update: {} });
  // Anything still waiting between you is closed quietly.
  await db.signal.updateMany({
    where: { status: "PENDING", OR: [{ fromUserId: viewer.user.id, toUserId: userId }, { fromUserId: userId, toUserId: viewer.user.id }] },
    data: { status: "WITHDRAWN", respondedAt: new Date() },
  });
  return { ok: true };
}

export async function unblock(viewer: Viewer, userId: string): Promise<{ ok: true }> {
  await db.block.deleteMany({ where: { blockerId: viewer.user.id, blockedId: userId } });
  return { ok: true };
}

export async function myBlocks(viewer: Viewer) {
  const rows = await db.block.findMany({ where: { blockerId: viewer.user.id }, orderBy: { createdAt: "desc" }, select: { blocked: { select: { id: true, name: true } } } });
  return rows.map((r) => r.blocked);
}

type ReportInput = { kind: "PERSON" | "MESSAGE" | "CIRCLE_MESSAGE" | "OPPORTUNITY" | "UPDATE"; targetId?: string; userId?: string; reason: ReportReason; note?: string };

/** Works out who and what is being reported, only from things the reporter can actually see. */
async function resolveTarget(viewer: Viewer, r: ReportInput): Promise<{ userId: string; excerpt: string | null } | null> {
  const uid = viewer.user.id;
  switch (r.kind) {
    case "PERSON":
      return r.userId && (await db.user.count({ where: { id: r.userId } })) ? { userId: r.userId, excerpt: null } : null;
    case "MESSAGE": {
      const m = r.targetId ? await db.directMessage.findUnique({ where: { id: r.targetId }, select: { authorId: true, text: true, conversation: { select: { members: { select: { userId: true } } } } } }) : null;
      return m && m.conversation.members.some((x) => x.userId === uid) ? { userId: m.authorId, excerpt: m.text } : null;
    }
    case "CIRCLE_MESSAGE": {
      const m = r.targetId ? await db.circleMessage.findUnique({ where: { id: r.targetId }, select: { authorId: true, text: true, circleId: true } }) : null;
      const seat = await db.circleMember.findUnique({ where: { userId: uid }, select: { circleId: true } });
      return m?.authorId && seat?.circleId === m.circleId ? { userId: m.authorId, excerpt: m.text } : null;
    }
    case "OPPORTUNITY": {
      const o = r.targetId ? await db.opportunity.findUnique({ where: { id: r.targetId }, select: { hostId: true, title: true, description: true, costNote: true } }) : null;
      return o ? { userId: o.hostId, excerpt: [o.title, o.description, o.costNote].filter(Boolean).join("\n") } : null;
    }
    case "UPDATE": {
      const u = r.targetId ? await db.founderUpdate.findUnique({ where: { id: r.targetId }, select: { authorId: true, text: true, author: { select: { profile: { select: { openToBackers: true } } } } } }) : null;
      return u && u.author.profile?.openToBackers ? { userId: u.authorId, excerpt: u.text } : null;
    }
  }
}

/** Report a person or something they wrote. Optionally block them in the same step. */
export async function report(viewer: Viewer, r: ReportInput & { alsoBlock?: boolean }): Promise<{ ok: true } | Fail> {
  if (!(r.reason in REPORT_REASONS)) return { ok: false, message: "Pick a reason." };
  const target = await resolveTarget(viewer, r);
  if (!target) return { ok: false, message: "We couldn't find that." };
  if (target.userId === viewer.user.id) return { ok: false, message: "That's yours." };
  const recent = await db.report.count({ where: { reporterId: viewer.user.id, targetUserId: target.userId, kind: r.kind, targetId: r.targetId ?? null, status: "OPEN" } });
  if (!recent) {
    await db.report.create({
      data: { reporterId: viewer.user.id, targetUserId: target.userId, kind: r.kind, targetId: r.targetId ?? null, excerpt: target.excerpt?.slice(0, 2000) ?? null, reason: r.reason, note: r.note?.trim().slice(0, 1000) || null },
    });
  }
  if (r.alsoBlock) await block(viewer, target.userId);
  return { ok: true };
}

// ── Admin: the moderation queue ───────────────────────────────

export async function openReports() {
  const rows = await db.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      kind: true,
      targetId: true,
      excerpt: true,
      reason: true,
      note: true,
      status: true,
      resolution: true,
      createdAt: true,
      reporter: { select: { name: true } },
      targetUser: { select: { id: true, name: true, profile: { select: { access: true } } } },
    },
  });
  const counts = await db.report.groupBy({ by: ["targetUserId"], _count: { _all: true } });
  const about = new Map(counts.map((c) => [c.targetUserId, c._count._all]));
  return rows.map((r) => ({ ...r, reportsAboutThem: about.get(r.targetUser.id) ?? 1 }));
}

/**
 * Resolve a report: optionally remove the reported content and/or suspend the
 * person (access back to NONE and signed out everywhere). Resolution is
 * written in words, for the record.
 */
export async function resolveReport(reportId: string, action: { removeContent: boolean; suspend: boolean; resolution: string }): Promise<{ ok: true } | Fail> {
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r) return { ok: false, message: "That report doesn't exist." };
  if (action.removeContent && r.targetId) {
    if (r.kind === "MESSAGE") await db.directMessage.deleteMany({ where: { id: r.targetId } });
    if (r.kind === "CIRCLE_MESSAGE") await db.circleMessage.deleteMany({ where: { id: r.targetId } });
    if (r.kind === "OPPORTUNITY") await db.opportunity.deleteMany({ where: { id: r.targetId } });
    if (r.kind === "UPDATE") await db.founderUpdate.deleteMany({ where: { id: r.targetId } });
  }
  if (action.suspend) {
    await db.profile.update({ where: { userId: r.targetUserId }, data: { access: "NONE", openToMatches: false, openToBackers: false } });
    await db.session.deleteMany({ where: { userId: r.targetUserId } });
  }
  const words = [action.removeContent && "content removed", action.suspend && "person suspended", action.resolution.trim()].filter(Boolean).join(" · ") || "no action";
  await db.report.updateMany({
    where: { OR: [{ id: reportId }, { targetUserId: r.targetUserId, kind: r.kind, targetId: r.targetId, status: "OPEN" }] },
    data: { status: "RESOLVED", resolution: words, resolvedAt: new Date() },
  });
  return { ok: true };
}

// ── Leaving SELF ──────────────────────────────────────────────

/**
 * Delete an account for good. First, every company they share with others is
 * handed to the next teammate (heirFor): ownership, and the pages and
 * versions they wrote there, so teammates lose nothing. Then the person and
 * everything that was only theirs (journal, personal space, messages,
 * requests) is deleted.
 */
export async function deleteAccount(userId: string): Promise<{ ok: true }> {
  const seats = await db.workspaceMember.findMany({ where: { userId }, select: { workspaceId: true, workspace: { select: { kind: true, createdById: true } } } });
  for (const seat of seats) {
    if (seat.workspace.kind !== "TEAM") continue;
    const members = await db.workspaceMember.findMany({ where: { workspaceId: seat.workspaceId }, select: { userId: true, role: true, joinedAt: true } });
    const heir = heirFor(members, userId);
    if (!heir) continue; // theirs alone: it goes with them
    await db.$transaction([
      ...(hasOtherOwner(members, userId) ? [] : [db.workspaceMember.update({ where: { workspaceId_userId: { workspaceId: seat.workspaceId, userId: heir } }, data: { role: "OWNER" } })]),
      ...(seat.workspace.createdById === userId ? [db.workspace.update({ where: { id: seat.workspaceId }, data: { createdById: heir } })] : []),
      db.page.updateMany({ where: { workspaceId: seat.workspaceId, createdById: userId }, data: { createdById: heir } }),
      db.page.updateMany({ where: { workspaceId: seat.workspaceId, updatedById: userId }, data: { updatedById: heir } }),
      db.pageVersion.updateMany({ where: { page: { workspaceId: seat.workspaceId }, createdById: userId }, data: { createdById: heir } }),
    ]);
  }
  await db.user.delete({ where: { id: userId } });
  return { ok: true };
}
