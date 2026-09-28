import { z } from "zod";

/** Shared (client + server) shape of a role opening. */
export const COMMITMENTS = ["Co-founder", "Part-time", "Advisor", "Freelance"] as const;

export const roleInput = z.object({
  title: z.string().trim().min(3, "Name the role.").max(80),
  commitment: z.enum(COMMITMENTS),
  description: z.string().trim().min(20, "Say what they'd own and why it matters.").max(1200),
  skills: z.array(z.string().trim().min(1).max(40)).max(8),
  planStepId: z.string().nullable(),
});
export type RoleInput = z.input<typeof roleInput>;
