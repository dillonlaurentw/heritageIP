/**
 * Who can do what in a workspace. Pure, so it's unit tested.
 * OWNER > ADMIN > MEMBER > GUEST.
 */
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

const RANK: Record<WorkspaceRole, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1, GUEST: 0 };

export const ROLE_LABEL: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  GUEST: "Guest",
};

export const ROLE_HINT: Record<WorkspaceRole, string> = {
  OWNER: "Everything, including deleting the workspace.",
  ADMIN: "Manage people and settings, and edit everything.",
  MEMBER: "Create and edit pages and databases.",
  GUEST: "Read everything and leave comments.",
};

export const atLeast = (role: WorkspaceRole | null | undefined, min: WorkspaceRole) =>
  role != null && RANK[role] >= RANK[min];

/** Create and edit pages. */
export const canEdit = (role: WorkspaceRole | null | undefined) => atLeast(role, "MEMBER");
/** Invite, remove, change roles, edit settings. */
export const canManage = (role: WorkspaceRole | null | undefined) => atLeast(role, "ADMIN");

/** Roles someone may hand out when inviting. Only owners make admins. */
export function invitableRoles(actor: WorkspaceRole): WorkspaceRole[] {
  if (actor === "OWNER") return ["ADMIN", "MEMBER", "GUEST"];
  if (actor === "ADMIN") return ["MEMBER", "GUEST"];
  return [];
}

/**
 * May `actor` change `target`'s role to `next`? Owners can't be demoted or
 * made here (ownership transfer is its own action), and admins only manage
 * members and guests.
 */
export function canChangeRole(actor: WorkspaceRole, target: WorkspaceRole, next: WorkspaceRole, isSelf: boolean) {
  if (isSelf) return false;
  if (target === "OWNER" || next === "OWNER") return false;
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return target !== "ADMIN" && next !== "ADMIN";
  return false;
}

/** Remove someone. Anyone but the owner may leave; managers may remove people below them. */
export function canRemove(actor: WorkspaceRole, target: WorkspaceRole, isSelf: boolean) {
  if (target === "OWNER") return false;
  if (isSelf) return true;
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return RANK[target] < RANK.ADMIN;
  return false;
}
