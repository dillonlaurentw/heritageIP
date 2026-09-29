import "server-only";
import { randomInt } from "node:crypto";
import { db } from "../db";
import { applicationProblem, circleFor, circleName, INVITES_PER_MEMBER, newInviteCode, normaliseCode } from "../app-rules";

type Fail = { ok: false; message: string };
const rand = () => randomInt(0, 1_000_000) / 1_000_000;

/**
 * Puts someone in a circle of founders like them (same field, ideally the
 * same stage), or starts a new one named after what they'd share. Runs once
 * we know their field: at the end of onboarding.
 */
export async function placeInCircle(userId: string) {
  if (await db.circleMember.findUnique({ where: { userId } })) return;
  const p = await db.profile.findUniqueOrThrow({ where: { userId }, select: { buildField: true, buildStage: true } });
  const person = { field: p.buildField ?? "OTHER", stage: p.buildStage };
  const circles = await db.circle.findMany({ where: { field: person.field }, select: { id: true, field: true, stage: true, _count: { select: { members: true } } } });
  let circleId = circleFor(person, circles.map((c) => ({ id: c.id, field: c.field, stage: c.stage, size: c._count.members })));
  if (!circleId) circleId = (await db.circle.create({ data: { name: circleName(person.field, person.stage), field: person.field, stage: person.stage } })).id;
  await db.circleMember.create({ data: { circleId, userId } });
}

/** Makes someone a member: access and invites of their own to share. Their circle comes after onboarding. */
export async function admit(userId: string) {
  const p = await db.profile.findUniqueOrThrow({ where: { userId }, select: { roles: true } });
  await db.profile.update({
    where: { userId },
    data: { access: "MEMBER", ...(p.roles.includes("BUILDER") ? {} : { roles: { push: "BUILDER" } }) },
  });
  // Already onboarded (e.g. an existing web user let in): place them now.
  const onboarded = await db.profile.count({ where: { userId, onboardedAt: { not: null } } });
  if (onboarded) await placeInCircle(userId);
  const have = await db.inviteCode.count({ where: { createdById: userId, usedById: null } });
  for (let i = have; i < INVITES_PER_MEMBER; i++) await db.inviteCode.create({ data: { code: newInviteCode(rand), createdById: userId } });
}

/** "I have an invite": one code, one person. */
export async function redeemInvite(userId: string, input: string): Promise<{ ok: true } | Fail> {
  const code = normaliseCode(input);
  if (!code) return { ok: false, message: "That doesn't look like a SELF code. It's like SELF-ABCD-EFGH." };
  const invite = await db.inviteCode.findUnique({ where: { code } });
  if (!invite) return { ok: false, message: "We couldn't find that code. Check it with the person who sent it." };
  if (invite.createdById === userId) return { ok: false, message: "That's one of your own codes. Send it to someone." };
  const { count } = await db.inviteCode.updateMany({ where: { id: invite.id, usedById: null }, data: { usedById: userId, usedAt: new Date() } });
  if (!count) return { ok: false, message: "That code has already been used." };
  await admit(userId);
  return { ok: true };
}

/** "Apply": two questions about doing, not status. An admin reviews it on the web. */
export async function applyForAccess(userId: string, input: { building: string; lastWeek: string }): Promise<{ ok: true } | Fail> {
  const problem = applicationProblem(input);
  if (problem) return { ok: false, message: problem };
  await db.application.upsert({
    where: { userId },
    create: { userId, building: input.building.trim(), lastWeek: input.lastWeek.trim() },
    update: { building: input.building.trim(), lastWeek: input.lastWeek.trim(), status: "PENDING", reviewedAt: null },
  });
  await db.profile.update({ where: { userId }, data: { access: "APPLIED" } });
  return { ok: true };
}

export async function reviewApplication(applicationId: string, approve: boolean) {
  // Answered once: a second click (or a second admin) changes nothing.
  const { count } = await db.application.updateMany({
    where: { id: applicationId, status: "PENDING" },
    data: { status: approve ? "APPROVED" : "DECLINED", reviewedAt: new Date() },
  });
  if (!count) return { ok: false as const, message: "Someone already answered this one." };
  const app = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { userId: true } });
  if (approve) await admit(app.userId);
  else await db.profile.update({ where: { userId: app.userId }, data: { access: "NONE" } });
  return { ok: true as const };
}

/** Your invite codes: unused ones to share, used ones with who joined. */
export async function myInvites(userId: string) {
  const codes = await db.inviteCode.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "asc" },
    select: { code: true, usedAt: true, usedBy: { select: { name: true } } },
  });
  return codes.map((c) => ({ code: c.code, usedBy: c.usedBy?.name ?? null, usedAt: c.usedAt?.toISOString() ?? null }));
}
