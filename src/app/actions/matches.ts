"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { candidatesFor, chairFor, explainMatch, inviteToChair } from "@/lib/matches";
import { requireOnboarded } from "@/lib/session";
import { requireWorkspaceRole } from "@/lib/workspaces";
import { db } from "@/lib/db";

const id = z.string().min(1).max(64);
const chairKey = z.string().min(1).max(80);

/** "Start a conversation": asks the person if they'd like to talk. They answer in their Connections. */
export async function inviteMatch(workspaceId: string, key: string, personId: string, note: string) {
  const viewer = await requireOnboarded();
  const res = await inviteToChair(viewer, id.parse(workspaceId), chairKey.parse(key), id.parse(personId), z.string().max(2000).parse(note));
  revalidatePath("/w/[ws]/matches", "page");
  return res;
}

/** Ask for a fresh explanation of a match (the cached one is replaced). */
export async function reexplainMatch(workspaceId: string, key: string, personId: string) {
  const viewer = await requireOnboarded();
  await requireWorkspaceRole(id.parse(workspaceId), viewer, "MEMBER");
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { id: true, name: true, oneLiner: true } });
  const chair = await chairFor(ws.id, chairKey.parse(key));
  if (!chair) return { ok: false as const, message: "That chair isn't open any more." };
  const person = (await candidatesFor(ws.id, viewer, chair)).find((c) => c.id === personId);
  if (!person) return { ok: false as const, message: "They aren't taking new conversations right now." };
  const res = await explainMatch(viewer, ws, chair, person, true);
  revalidatePath("/w/[ws]/matches", "page");
  return res;
}
