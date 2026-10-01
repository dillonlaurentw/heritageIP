import type { ProfileInput } from "@/lib/profile-schema";

/*
 * The onboarding script. Edit copy here; the flow renders whatever is listed.
 * Self5: three screens for a builder (name, what brings you, what you're
 * building). The rest of their Self is learned later, never asked up front.
 * Keep prompts short and human. `lines` are the display line breaks.
 */

type Role = ProfileInput["roles"][number];

export type Step =
  | { id: string; kind: "name"; lines: string[]; helper: string }
  | { id: string; kind: "roles"; lines: string[]; helper: string }
  | {
      id: string;
      kind: "reflect";
      field: "beliefs" | "workStyle" | "buildingToward" | "strengths" | "gaps" | "decisionStyle";
      lines: string[];
      helper: string;
      placeholder: string;
      for: Role;
    }
  | { id: string; kind: "focus"; note: "mentorNote" | "backerNote"; lines: string[]; helper: string; placeholder: string; for: Role }
  | { id: string; kind: "partner"; lines: string[]; helper: string; for: Role }
  | { id: string; kind: "contact"; lines: string[]; helper: string };

export const STEPS: Step[] = [
  {
    id: "name",
    kind: "name",
    lines: ["First things first.", "What should we", "call you?"],
    helper: "Add one line about you too, if you like. You can change it later.",
  },
  {
    id: "roles",
    kind: "roles",
    lines: ["What brings", "you here?"],
    helper: "Pick everything that fits. Most people are more than one.",
  },
  {
    id: "buildingToward",
    kind: "reflect",
    for: "BUILDER",
    field: "buildingToward",
    lines: ["What are you", "building?"],
    helper: "Half-formed is fine. Say it the way you'd tell a friend.",
    placeholder: "I'm building… because…",
  },
  {
    id: "mentor",
    kind: "focus",
    for: "MENTOR",
    note: "mentorNote",
    lines: ["What can you", "help with?"],
    helper: "Pick up to eight areas, then say it in your own words.",
    placeholder: "I've spent ten years in… I'm most useful when…",
  },
  {
    id: "backer",
    kind: "focus",
    for: "BACKER",
    note: "backerNote",
    lines: ["What do you", "back?"],
    helper: "Sectors, stages, the kind of people. No amounts: SELF only makes introductions.",
    placeholder: "I back first-time founders who…",
  },
  {
    id: "partner",
    kind: "partner",
    for: "PARTNER",
    lines: ["Who do you", "work with?"],
    helper: "Your firm or studio. You'll set up its full profile in the partner directory.",
  },
];

export function stepsFor(roles: Role[]) {
  return STEPS.filter((s) => !("for" in s) || roles.includes(s.for));
}

export const ROLE_COPY: Record<Role, { title: string; line: string }> = {
  BUILDER: { title: "Builder", line: "I have an idea, or want one, and I'm here to build it." },
  BACKER: { title: "Backer", line: "I want to find people and ideas worth backing." },
  PARTNER: { title: "Partner", line: "My firm helps builders: legal, supply, build, marketing." },
  MENTOR: { title: "Mentor", line: "I've done this before and want to help someone else." },
};
