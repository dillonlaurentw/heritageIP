"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { answerTrialProposal, loadThread, proposeTrial, sendMessage } from "@/lib/messages";
import { requireOnboarded } from "@/lib/session";

const id = z.string().min(1).max(64);

export type ThreadMessage = { id: string; authorId: string; kind: "TEXT" | "TRIAL_PROPOSAL" | "NOTE"; text: string; data: unknown; at: string };

const shape = (m: { id: string; authorId: string; kind: ThreadMessage["kind"]; text: string; data: unknown; createdAt: Date }): ThreadMessage => ({
  id: m.id,
  authorId: m.authorId,
  kind: m.kind,
  text: m.text,
  data: m.data,
  at: m.createdAt.toISOString(),
});

export async function sendDirectMessage(conversationId: string, text: string) {
  const viewer = await requireOnboarded();
  const res = await sendMessage(viewer, id.parse(conversationId), z.string().max(8000).parse(text));
  revalidatePath("/messages", "layout");
  return res;
}

/** Everything in the conversation (the thread polls this while it's open). Marks it read. */
export async function pollThread(conversationId: string) {
  const viewer = await requireOnboarded();
  const t = await loadThread(viewer, id.parse(conversationId));
  if (!t) return { ok: false as const, message: "That conversation isn't yours." };
  return { ok: true as const, messages: t.messages.map(shape) };
}

const trialInput = z.object({ workspaceId: id, roleId: id.nullable().optional(), title: z.string().max(120), focus: z.string().max(600) });

export async function proposeTrialWeek(conversationId: string, input: z.infer<typeof trialInput>) {
  const viewer = await requireOnboarded();
  const parsed = trialInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Check the trial week details." };
  const res = await proposeTrial(viewer, id.parse(conversationId), parsed.data);
  revalidatePath("/messages", "layout");
  return res;
}

export async function answerTrialWeek(messageId: string, action: "accept" | "decline" | "withdraw") {
  const viewer = await requireOnboarded();
  const res = await answerTrialProposal(viewer, id.parse(messageId), z.enum(["accept", "decline", "withdraw"]).parse(action));
  revalidatePath("/", "layout");
  return res;
}
