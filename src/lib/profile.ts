import "server-only";
import { db } from "./db";
import { mentionsTerms, NO_TERMS_MESSAGE } from "./no-terms";
import { profileFieldsPartial, type ProfileInput } from "./profile-schema";

export type SaveResult = { ok: true } | { ok: false; errors: Record<string, string> };

/**
 * Validate and save any subset of profile fields for one user.
 * `name` lives on the auth User; everything else on Profile.
 * ADMIN is never settable from here and is preserved if present.
 */
export async function saveProfileFields(userId: string, input: Partial<ProfileInput>): Promise<SaveResult> {
  const parsed = profileFieldsPartial.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, errors };
  }
  const { name, roles, ...fields } = parsed.data;
  const terms = fields.backerNote ? mentionsTerms(fields.backerNote) : null;
  if (terms) return { ok: false, errors: { backerNote: NO_TERMS_MESSAGE(terms) } };

  await db.$transaction(async (tx) => {
    if (name !== undefined) await tx.user.update({ where: { id: userId }, data: { name } });
    let nextRoles;
    if (roles) {
      const current = await tx.profile.findUniqueOrThrow({ where: { userId }, select: { roles: true } });
      nextRoles = current.roles.includes("ADMIN") ? [...roles, "ADMIN" as const] : roles;
    }
    await tx.profile.update({ where: { userId }, data: { ...fields, ...(nextRoles && { roles: nextRoles }) } });
  });
  return { ok: true };
}
