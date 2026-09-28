export const ROLE_LABEL: Record<string, string> = {
  BUILDER: "Builder",
  BACKER: "Backer",
  PARTNER: "Partner",
  MENTOR: "Mentor",
  ADMIN: "Admin",
};

export const rolesLine = (roles: string[]) => roles.map((r) => ROLE_LABEL[r] ?? r).join(" · ");
