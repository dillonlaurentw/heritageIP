"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FIELDS, OPPORTUNITY_KINDS, STAGES } from "@/lib/app-rules";
import { follow, postUpdate, sendInterest, setOpenToBackers, deleteUpdate } from "@/lib/app/capital";
import { catchUp, postToCircle } from "@/lib/app/circles";
import { deleteJournal, shareJournal, writeJournal } from "@/lib/app/journal";
import { answerSeat, closeOpportunity, createOpportunity, requestSeat, withdrawSeat } from "@/lib/app/opportunities";
import { requireOnboarded } from "@/lib/session";

/**
 * The web side of the SELF app's journal, circle, opportunities and capital.
 * Same server logic as /api/m/*; every action checks the person is a member.
 */
const id = z.string().min(1).max(64);
type Fail = { ok: false; message: string };

async function member() {
  const viewer = await requireOnboarded();
  if (viewer.profile.access !== "MEMBER") return { viewer: null, fail: { ok: false, message: "This is for SELF's members. Ask a member for an invite." } as Fail };
  return { viewer, fail: null };
}

// Journal (private)
export async function journalWrite(text: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await writeJournal(viewer, z.string().max(8000).parse(text), false);
  revalidatePath("/journal");
  return r;
}
export async function journalDelete(entryId: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await deleteJournal(viewer.user.id, id.parse(entryId));
  revalidatePath("/journal");
  return r;
}
export async function journalShare(entryId: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await shareJournal(viewer.user.id, id.parse(entryId));
  revalidatePath("/journal");
  revalidatePath("/circle");
  return r;
}

// Circle
export async function circleSay(text: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await postToCircle(viewer.user.id, z.string().max(4000).parse(text));
  revalidatePath("/circle");
  return r;
}
export async function circleCatchUp() {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await catchUp(viewer.user.id);
  revalidatePath("/circle");
  return r;
}

// Opportunities
export async function opportunityAsk(opportunityId: string, why: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await requestSeat(viewer, id.parse(opportunityId), z.string().max(1000).parse(why));
  revalidatePath("/opportunities");
  return r;
}
export async function opportunityWithdraw(opportunityId: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await withdrawSeat(viewer, id.parse(opportunityId));
  revalidatePath("/opportunities");
  return r;
}
export async function opportunityAnswer(requestId: string, pick: boolean) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await answerSeat(viewer, id.parse(requestId), z.boolean().parse(pick));
  revalidatePath("/opportunities");
  return r.ok ? { ok: true as const } : r;
}
export async function opportunityClose(opportunityId: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await closeOpportunity(viewer, id.parse(opportunityId));
  revalidatePath("/opportunities");
  return r;
}
const newOpp = z.object({
  kind: z.enum(Object.keys(OPPORTUNITY_KINDS) as [keyof typeof OPPORTUNITY_KINDS, ...(keyof typeof OPPORTUNITY_KINDS)[]]),
  title: z.string().max(120),
  description: z.string().max(2000),
  place: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seats: z.number().int(),
  forWho: z.string().max(200),
  fields: z.array(z.enum(Object.keys(FIELDS) as [string, ...string[]])).max(8),
  stages: z.array(z.enum(Object.keys(STAGES) as [string, ...string[]])).max(4),
  buildingOnly: z.boolean(),
  costNote: z.string().max(200),
});
export async function opportunityCreate(input: z.infer<typeof newOpp>) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const b = newOpp.parse(input);
  const r = await createOpportunity(viewer, { ...b, startsAt: new Date(`${b.date}T18:00:00Z`), forWho: b.forWho || "Any member", costNote: b.costNote || null });
  revalidatePath("/opportunities");
  return r;
}

// Capital (interest only)
export async function capitalOpen(on: boolean) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await setOpenToBackers(viewer, z.boolean().parse(on));
  revalidatePath("/capital");
  return r;
}
export async function capitalUpdate(text: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await postUpdate(viewer, z.string().max(2000).parse(text));
  revalidatePath("/capital");
  return r;
}
export async function capitalDeleteUpdate(updateId: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await deleteUpdate(viewer, id.parse(updateId));
  revalidatePath("/capital");
  return r;
}
export async function capitalFollow(founderId: string, on: boolean) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await follow(viewer, id.parse(founderId), z.boolean().parse(on));
  revalidatePath("/capital");
  return r;
}
export async function capitalInterest(founderId: string, note: string) {
  const { viewer, fail } = await member();
  if (!viewer) return fail;
  const r = await sendInterest(viewer, id.parse(founderId), z.string().max(2000).parse(note));
  revalidatePath("/capital");
  return r;
}
