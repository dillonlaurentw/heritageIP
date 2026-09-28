import { describe, expect, it } from "vitest";
import { canChangeRole, canEdit, canManage, canRemove, invitableRoles } from "../workspace-rules";

describe("workspace roles", () => {
  it("members edit, guests don't; admins and owners manage", () => {
    expect(canEdit("GUEST")).toBe(false);
    expect(canEdit("MEMBER")).toBe(true);
    expect(canManage("MEMBER")).toBe(false);
    expect(canManage("ADMIN")).toBe(true);
    expect(canManage("OWNER")).toBe(true);
    expect(canEdit(null)).toBe(false);
  });

  it("only owners invite admins; members can't invite", () => {
    expect(invitableRoles("OWNER")).toContain("ADMIN");
    expect(invitableRoles("ADMIN")).toEqual(["MEMBER", "GUEST"]);
    expect(invitableRoles("MEMBER")).toEqual([]);
  });

  it("role changes never touch the owner and never apply to yourself", () => {
    expect(canChangeRole("OWNER", "MEMBER", "ADMIN", false)).toBe(true);
    expect(canChangeRole("OWNER", "OWNER", "ADMIN", false)).toBe(false);
    expect(canChangeRole("OWNER", "MEMBER", "OWNER", false)).toBe(false);
    expect(canChangeRole("ADMIN", "MEMBER", "GUEST", false)).toBe(true);
    expect(canChangeRole("ADMIN", "ADMIN", "MEMBER", false)).toBe(false);
    expect(canChangeRole("ADMIN", "MEMBER", "ADMIN", false)).toBe(false);
    expect(canChangeRole("ADMIN", "MEMBER", "GUEST", true)).toBe(false);
    expect(canChangeRole("MEMBER", "GUEST", "MEMBER", false)).toBe(false);
  });

  it("anyone but the owner can leave; managers remove people below them", () => {
    expect(canRemove("MEMBER", "MEMBER", true)).toBe(true);
    expect(canRemove("OWNER", "OWNER", true)).toBe(false);
    expect(canRemove("ADMIN", "MEMBER", false)).toBe(true);
    expect(canRemove("ADMIN", "ADMIN", false)).toBe(false);
    expect(canRemove("OWNER", "ADMIN", false)).toBe(true);
    expect(canRemove("MEMBER", "GUEST", false)).toBe(false);
  });
});
