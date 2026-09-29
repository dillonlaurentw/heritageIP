"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  actOnSignal,
  postRole,
  requestIntro,
  requestMentor,
  sendBackerInterest,
  sendRoleInterest,
} from "@/lib/network";
import { mentionsTerms, NO_TERMS_MESSAGE } from "@/lib/no-terms";
import { FOCUS_AREAS } from "@/lib/profile-schema";
import { requireOnboarded } from "@/lib/session";
import { readThesis } from "@/lib/thesis";
import { logActivity, requireWorkspaceRole } from "@/lib/workspaces";

const id = z.string().min(1).max(64);
const note = z.string().trim().min(10, "Say a little more: a sentence or two.").max(1000);
type Result = { ok: true } | { ok: false; message: string };

function fail(e: z.ZodError): { ok: false; message: string } {
  return { ok: false, message: e.issues[0]?.message ?? "Check the form." };
}

const done = (res: Result, ...paths: string[]) => {
  if (res.ok) for (const p of paths.length ? paths : ["/"]) revalidatePath(p, "layout");
  return res;
};

export async function expressInterest(roleId: string, text: string): Promise<Result> {
  const viewer = await requireOnboarded();
  const n = note.safeParse(text);
  if (!n.success) return fail(n.error);
  return done(await sendRoleInterest(viewer, id.parse(roleId), n.data));
}

const roleInput = z.object({
  workspaceId: id,
  title: z.string().trim().min(3, "Give the role a title.").max(120),
  commitment: z.enum(["cofounder", "parttime", "advisor", "freelance"]),
  skills: z.string().trim().max(300),
  description: z.string().trim().max(3000),
  stepId: id.nullable(),
});

export async function postRoleAction(input: z.input<typeof roleInput>): Promise<{ ok: true; href: string } | { ok: false; message: string }> {
  const viewer = await requireOnboarded();
  const parsed = roleInput.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const res = await postRole(viewer, parsed.data);
  if (res.ok) revalidatePath("/", "layout");
  return res;
}

const requestInput = z.object({ workspaceId: id, targetId: id, stepId: id.nullable(), note: z.string() });

export async function requestIntroAction(input: z.input<typeof requestInput>): Promise<Result> {
  const viewer = await requireOnboarded();
  const i = requestInput.parse(input);
  const n = note.safeParse(i.note);
  if (!n.success) return fail(n.error);
  return done(await requestIntro(viewer, { workspaceId: i.workspaceId, partnerId: i.targetId, stepId: i.stepId, note: n.data }));
}

export async function requestMentorAction(input: z.input<typeof requestInput>): Promise<Result> {
  const viewer = await requireOnboarded();
  const i = requestInput.parse(input);
  const n = note.safeParse(i.note);
  if (!n.success) return fail(n.error);
  return done(await requestMentor(viewer, { workspaceId: i.workspaceId, mentorId: i.targetId, stepId: i.stepId, note: n.data }));
}

export async function backerInterestAction(workspaceId: string, text: string): Promise<Result> {
  const viewer = await requireOnboarded();
  const n = note.safeParse(text);
  if (!n.success) return fail(n.error);
  const terms = mentionsTerms(n.data);
  if (terms) return { ok: false, message: NO_TERMS_MESSAGE(terms) };
  return done(await sendBackerInterest(viewer, id.parse(workspaceId), n.data));
}

export async function answerSignal(signalId: string, action: "accept" | "decline" | "withdraw"): Promise<Result> {
  const viewer = await requireOnboarded();
  const a = z.enum(["accept", "decline", "withdraw"]).parse(action);
  const res = await actOnSignal(id.parse(signalId), viewer, a);
  return done(res.ok ? { ok: true } : res);
}

/** After accepting someone's interest in a role, the owner can add them to the workspace. Explicit, never automatic. */
export async function addCandidateToWorkspace(signalId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  const s = await db.signal.findUnique({ where: { id: id.parse(signalId) }, include: { page: { select: { title: true } } } });
  if (!s || s.kind !== "ROLE_INTEREST" || s.status !== "ACCEPTED" || !s.workspaceId || s.toUserId !== viewer.user.id) {
    return { ok: false, message: "You can add people after you've accepted their interest." };
  }
  await requireWorkspaceRole(s.workspaceId, viewer, "ADMIN");
  await db.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: s.workspaceId, userId: s.fromUserId } },
    create: { workspaceId: s.workspaceId, userId: s.fromUserId, role: "MEMBER", title: s.page?.title ?? null },
    update: {},
  });
  await logActivity(s.workspaceId, s.fromUserId, "member.joined");
  await db.notification.create({
    data: {
      userId: s.fromUserId,
      actorId: viewer.user.id,
      kind: "INVITE",
      text: `${viewer.user.name} added you to the workspace`,
      href: `/w/${(await db.workspace.findUniqueOrThrow({ where: { id: s.workspaceId }, select: { slug: true } })).slug}`,
      workspaceId: s.workspaceId,
    },
  });
  return done({ ok: true });
}

const discoveryInput = z.object({
  discoverable: z.boolean(),
  sector: z.enum(FOCUS_AREAS).nullable(),
  backerAsk: z.string().trim().max(500),
});

/** Open (or close) a workspace to backers. Needs a saved thesis and a sector. Interest only. */
export async function setDiscovery(workspaceId: string, input: z.input<typeof discoveryInput>): Promise<Result> {
  const viewer = await requireOnboarded();
  const wsId = id.parse(workspaceId);
  await requireWorkspaceRole(wsId, viewer, "ADMIN");
  const parsed = discoveryInput.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const i = parsed.data;
  const terms = mentionsTerms(i.backerAsk);
  if (terms) return { ok: false, message: NO_TERMS_MESSAGE(terms) };
  if (i.discoverable) {
    if (!(await readThesis(wsId))) return { ok: false, message: "Write the thesis first: it's what backers read." };
    if (!i.sector) return { ok: false, message: "Pick a sector so the right backers find you." };
  }
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: wsId }, select: { discoverable: true } });
  await db.workspace.update({
    where: { id: wsId },
    data: {
      discoverable: i.discoverable,
      discoverableAt: i.discoverable && !ws.discoverable ? new Date() : undefined,
      sector: i.sector,
      backerAsk: i.backerAsk || null,
    },
  });
  if (i.discoverable !== ws.discoverable) await logActivity(wsId, viewer.user.id, i.discoverable ? "backers.opened" : "backers.closed");
  return done({ ok: true });
}

export async function setMentorOpen(open: boolean): Promise<Result> {
  const viewer = await requireOnboarded();
  if (!viewer.profile.roles.includes("MENTOR")) return { ok: false, message: "Only mentors have this switch." };
  await db.profile.update({ where: { userId: viewer.user.id }, data: { mentorOpen: z.boolean().parse(open) } });
  return done({ ok: true });
}

const partnerInput = z.object({
  tagline: z.string().trim().min(5).max(140),
  description: z.string().trim().min(20).max(2000),
  services: z.array(z.string().trim().min(2).max(60)).max(10),
  location: z.string().trim().max(80),
  priceNote: z.string().trim().max(120),
  website: z.string().trim().url().or(z.literal("")),
  contactEmail: z.string().trim().email(),
});

/** A PARTNER edits the firm profile they manage. */
export async function updatePartnerProfile(partnerId: string, input: z.input<typeof partnerInput>): Promise<Result> {
  const viewer = await requireOnboarded();
  const partner = await db.partner.findUnique({ where: { id: id.parse(partnerId) } });
  if (!partner || partner.claimedById !== viewer.user.id) return { ok: false, message: "You can only edit the firm you manage." };
  const parsed = partnerInput.safeParse(input);
  if (!parsed.success) return fail(parsed.error);
  const i = parsed.data;
  await db.partner.update({
    where: { id: partner.id },
    data: { ...i, priceNote: i.priceNote || null, website: i.website || null },
  });
  return done({ ok: true });
}
