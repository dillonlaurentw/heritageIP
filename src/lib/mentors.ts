import "server-only";
import { db } from "./db";
import { sendEmail } from "./email";

const appUrl = () => process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const mentorSelect = {
  id: true,
  name: true,
  profile: { select: { headline: true, location: true, focusAreas: true, mentorNote: true, mentorOpen: true, roles: true } },
} as const;

/** A hub owner asks a mentor for help, optionally for a plan step. */
export async function requestMentor(input: { fromUserId: string; mentorId: string; hubId: string; planStepId: string | null; note: string }) {
  if (input.mentorId === input.fromUserId) return { ok: false as const, message: "You can't mentor yourself here." };
  const [mentor, hub] = await Promise.all([
    db.user.findUnique({ where: { id: input.mentorId }, select: mentorSelect }),
    db.hub.findUnique({ where: { id: input.hubId } }),
  ]);
  if (!mentor?.profile?.roles.includes("MENTOR")) return { ok: false as const, message: "That person isn't mentoring on SELF." };
  if (!mentor.profile.mentorOpen) return { ok: false as const, message: `${mentor.name} isn't taking new requests right now.` };
  if (!hub || hub.ownerId !== input.fromUserId) return { ok: false as const, message: "Pick one of your own hubs." };
  const step = input.planStepId ? await db.planStep.findFirst({ where: { id: input.planStepId, hubId: hub.id } }) : null;
  const existing = await db.signal.findFirst({
    where: { kind: "MENTOR_REQUEST", hubId: hub.id, toUserId: mentor.id, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (existing) return { ok: false as const, message: `You've already asked ${mentor.name} about ${hub.name}.` };

  const signal = await db.signal.create({
    data: {
      kind: "MENTOR_REQUEST",
      fromUserId: input.fromUserId,
      toUserId: mentor.id,
      hubId: hub.id,
      planStepId: step?.id ?? null,
      note: input.note,
    },
    include: { fromUser: true, toUser: true },
  });
  await sendEmail({
    to: signal.toUser.email,
    subject: `${signal.fromUser.name} would like your help with ${hub.name}`,
    text: [
      `${signal.fromUser.name} is building ${hub.name}${hub.oneLiner ? `: ${hub.oneLiner}` : ""}.`,
      step ? `They're working on: ${step.title}` : null,
      `"${input.note}"`,
      `Accept or decline: ${appUrl()}/connections`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
  return { ok: true as const };
}
