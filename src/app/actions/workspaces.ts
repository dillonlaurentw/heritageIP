"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { requireOnboarded } from "@/lib/session";
import { createWorkspace } from "@/lib/workspace-create";
import { canChangeRole, canRemove, invitableRoles, ROLE_LABEL, type WorkspaceRole } from "@/lib/workspace-rules";
import { inviteExpiry, logActivity, newInviteToken, requireWorkspaceRole, roleIn } from "@/lib/workspaces";

const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const role = z.enum(["OWNER", "ADMIN", "MEMBER", "GUEST"]);
type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string; errors?: Record<string, string> };

const newWorkspace = z.object({
  name: z.string().trim().min(1, "Give it a name. You can change it later.").max(60),
  oneLiner: z.string().trim().max(140).optional(),
  rawIdea: z.string().trim().max(2000).optional(),
});

export type CreateState = { errors?: Record<string, string> };

export async function createWorkspaceAction(_prev: CreateState, form: FormData): Promise<CreateState> {
  const viewer = await requireOnboarded();
  const parsed = newWorkspace.safeParse({
    name: form.get("name"),
    oneLiner: form.get("oneLiner") || undefined,
    rawIdea: form.get("rawIdea") || undefined,
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors };
  }
  const ws = await createWorkspace(parsed.data, viewer.user.id);
  // Started from an idea: go straight to turning it into a thesis.
  redirect((parsed.data.rawIdea ? `/w/${ws.slug}/thesis` : `/w/${ws.slug}`) as never);
}

const settings = z.object({
  name: z.string().trim().min(1, "A name, please.").max(60),
  oneLiner: z.string().trim().max(140),
  icon: z.string().trim().max(4),
});

export async function updateWorkspace(workspaceId: string, input: z.infer<typeof settings>): Promise<Result> {
  const viewer = await requireOnboarded();
  await requireWorkspaceRole(workspaceId, viewer, "ADMIN");
  const parsed = settings.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await db.workspace.update({
    where: { id: workspaceId },
    data: { name: parsed.data.name, oneLiner: parsed.data.oneLiner || null, icon: parsed.data.icon || null },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteWorkspace(workspaceId: string, confirmName: string): Promise<Result> {
  const viewer = await requireOnboarded();
  await requireWorkspaceRole(workspaceId, viewer, "OWNER");
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  if (ws.kind !== "TEAM") return { ok: false, message: "Your private space can't be deleted." };
  if (confirmName.trim() !== ws.name) return { ok: false, message: "Type the workspace name exactly to confirm." };
  await db.workspace.delete({ where: { id: workspaceId } });
  redirect("/home");
}

const inviteInput = z.object({
  emails: z
    .string()
    .transform((s) => s.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))
    .pipe(z.array(z.email("One of those isn't an email.")).min(1, "Add at least one email.").max(20)),
  role,
});

export async function inviteMembers(workspaceId: string, emails: string, inviteRole: WorkspaceRole): Promise<Result<{ links: { email: string; url: string }[] }>> {
  const viewer = await requireOnboarded();
  const myRole = await requireWorkspaceRole(workspaceId, viewer, "ADMIN");
  const parsed = inviteInput.safeParse({ emails, role: inviteRole });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (!invitableRoles(myRole).includes(parsed.data.role)) return { ok: false, message: "You can't invite people at that level." };

  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const existing = await db.workspaceMember.findMany({
    where: { workspaceId, user: { email: { in: parsed.data.emails } } },
    select: { user: { select: { email: true } } },
  });
  const already = new Set(existing.map((m) => m.user.email.toLowerCase()));
  const links: { email: string; url: string }[] = [];
  for (const email of parsed.data.emails) {
    if (already.has(email)) continue;
    // One live invite per email: refresh it rather than stacking duplicates.
    await db.invite.deleteMany({ where: { workspaceId, email, acceptedAt: null } });
    const invite = await db.invite.create({
      data: { workspaceId, email, role: parsed.data.role, token: newInviteToken(), invitedById: viewer.user.id, expiresAt: inviteExpiry() },
    });
    const url = `${appUrl()}/invite/${invite.token}`;
    links.push({ email, url });
    await sendEmail({
      to: email,
      subject: `${viewer.user.name} invited you to ${ws.name} on SELF`,
      text: `${viewer.user.name} invited you to join ${ws.name} on SELF as ${ROLE_LABEL[parsed.data.role].toLowerCase()}.\n\nJoin here: ${url}\n\nThe link works for 14 days.`,
    });
  }
  if (links.length === 0) return { ok: false, message: "Everyone there is already in this workspace." };
  revalidatePath(`/w/${ws.slug}/people`);
  return { ok: true, links };
}

export async function revokeInvite(inviteId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  const invite = await db.invite.findUniqueOrThrow({ where: { id: z.string().parse(inviteId) }, include: { workspace: true } });
  await requireWorkspaceRole(invite.workspaceId, viewer, "ADMIN");
  await db.invite.delete({ where: { id: invite.id } });
  revalidatePath(`/w/${invite.workspace.slug}/people`);
  return { ok: true };
}

export async function changeMemberRole(workspaceId: string, userId: string, next: WorkspaceRole): Promise<Result> {
  const viewer = await requireOnboarded();
  const actor = await requireWorkspaceRole(workspaceId, viewer, "ADMIN");
  const target = await roleIn(workspaceId, userId);
  const nextRole = role.parse(next);
  if (!target || !canChangeRole(actor, target, nextRole, userId === viewer.user.id)) {
    return { ok: false, message: "You can't change that person's role." };
  }
  await db.workspaceMember.update({ where: { workspaceId_userId: { workspaceId, userId } }, data: { role: nextRole } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setMemberTitle(workspaceId: string, userId: string, title: string): Promise<Result> {
  const viewer = await requireOnboarded();
  // You can set your own title; admins can set anyone's.
  await requireWorkspaceRole(workspaceId, viewer, userId === viewer.user.id ? "GUEST" : "ADMIN");
  await db.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { title: z.string().trim().max(60).parse(title) || null },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeMember(workspaceId: string, userId: string): Promise<Result> {
  const viewer = await requireOnboarded();
  const actor = await roleIn(workspaceId, viewer.user.id);
  const target = await roleIn(workspaceId, userId);
  const self = userId === viewer.user.id;
  if (!actor || !target || !canRemove(actor, target, self)) return { ok: false, message: "You can't remove that person." };
  await db.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId, userId } } });
  await logActivity(workspaceId, viewer.user.id, self ? "member.left" : "member.removed", null, { userId });
  if (self) redirect("/home");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Accept an invite. The signed-in email must match the invited one. */
export async function acceptInvite(token: string): Promise<Result> {
  const viewer = await requireOnboarded();
  const invite = await db.invite.findUnique({ where: { token: z.string().max(100).parse(token) }, include: { workspace: true } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return { ok: false, message: "That invite has expired or was already used." };
  if (invite.email.toLowerCase() !== viewer.user.email.toLowerCase()) {
    return { ok: false, message: `This invite is for ${invite.email}. Sign in with that email to accept it.` };
  }
  await db.$transaction([
    db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: viewer.user.id } },
      create: { workspaceId: invite.workspaceId, userId: viewer.user.id, role: invite.role },
      update: {},
    }),
    db.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  await logActivity(invite.workspaceId, viewer.user.id, "member.joined", null, { name: viewer.user.name });
  redirect(`/w/${invite.workspace.slug}` as never);
}
