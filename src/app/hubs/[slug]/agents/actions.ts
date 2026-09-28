"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hubBriefing, hubChatAgent, routerAgent, runAgent } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { HUB_AGENTS, type HubAgentKey } from "@/lib/hub-agents";
import { requireHubAccessById } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";

const LEGAL_FOOTER = "This isn't legal advice. Confirm with a lawyer; SELF's Legal partners can help.";

export type ChatMessage = {
  id: string;
  role: "USER" | "AGENT";
  text: string;
  suggestedStep: { title: string; detail: string; stage: string; needs: string[] } | null;
  addedStepId: string | null;
};

const threadKind = (key: HubAgentKey) => `hub:${key}`;

async function currentThread(userId: string, hubId: string, key: HubAgentKey) {
  return (
    (await db.agentThread.findFirst({ where: { userId, hubId, kind: threadKind(key) }, orderBy: { createdAt: "desc" } })) ??
    (await db.agentThread.create({ data: { userId, hubId, kind: threadKind(key) } }))
  );
}

export async function sendMessage(hubId: string, key: string, text: string) {
  const viewer = await requireOnboarded();
  const { hub, isOwner } = await requireHubAccessById(hubId, viewer);
  const agent = z.enum(HUB_AGENTS).parse(key);
  const message = z.string().trim().min(1, "Say something first.").max(2000, "Keep it under 2,000 characters.").safeParse(text);
  if (!message.success) return { ok: false as const, message: message.error.issues[0].message };

  const thread = await currentThread(viewer.user.id, hub.id, agent);
  const history = await db.agentMessage.findMany({ where: { threadId: thread.id }, orderBy: { createdAt: "asc" }, select: { role: true, text: true } });
  const res = await runAgent(
    hubChatAgent,
    {
      agent,
      briefing: await hubBriefing(hub.id),
      askerName: viewer.user.name,
      askerIsOwner: isOwner,
      history,
      message: message.data,
    },
    { userId: viewer.user.id, hubId: hub.id },
  );
  if (!res.ok) return res;

  let reply = res.output.reply.trim();
  // Belt and braces: the legal explainer always ends with the disclaimer.
  if (agent === "legal" && !/lawyer/i.test(reply.split("\n").slice(-2).join(" "))) reply = `${reply}\n\n${LEGAL_FOOTER}`;

  const [userMsg, agentMsg] = await db.$transaction([
    db.agentMessage.create({ data: { threadId: thread.id, role: "USER", text: message.data } }),
    db.agentMessage.create({
      data: {
        threadId: thread.id,
        role: "AGENT",
        text: reply,
        data: { suggestedStep: res.output.suggestedStep } as Prisma.InputJsonValue,
      },
    }),
  ]);
  await db.agentThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
  return {
    ok: true as const,
    demo: res.demo,
    messages: [
      { id: userMsg.id, role: "USER", text: userMsg.text, suggestedStep: null, addedStepId: null },
      { id: agentMsg.id, role: "AGENT", text: agentMsg.text, suggestedStep: res.output.suggestedStep, addedStepId: null },
    ] satisfies ChatMessage[],
  };
}

export async function newConversation(hubId: string, key: string) {
  const viewer = await requireOnboarded();
  const { hub } = await requireHubAccessById(hubId, viewer);
  const agent = z.enum(HUB_AGENTS).parse(key);
  await db.agentThread.create({ data: { userId: viewer.user.id, hubId: hub.id, kind: threadKind(agent) } });
  revalidatePath(`/hubs/${hub.slug}/agents/${agent}`);
}

/** The owner turns an agent's suggestion into a real plan step. */
export async function addSuggestedStep(messageId: string) {
  const viewer = await requireOnboarded();
  const msg = await db.agentMessage.findUnique({ where: { id: messageId }, include: { thread: { include: { hub: true } } } });
  const hub = msg?.thread.hub;
  if (!msg || !hub || hub.ownerId !== viewer.user.id || msg.thread.userId !== viewer.user.id) {
    return { ok: false as const, message: "Only the hub's owner can add steps." };
  }
  const data = (msg.data ?? {}) as { suggestedStep?: ChatMessage["suggestedStep"]; addedStepId?: string };
  if (data.addedStepId) return { ok: true as const, stepId: data.addedStepId };
  const s = z
    .object({
      title: z.string().min(1).max(120),
      detail: z.string().max(600),
      stage: z.enum(["VALIDATE", "SETUP", "BUILD", "LAUNCH"]),
      needs: z.array(z.enum(["COFOUNDER", "SUPPLIER", "LEGAL", "FUNDING", "MARKETING", "GTM", "WEBSITE", "MENTOR"])),
    })
    .safeParse(data.suggestedStep);
  if (!s.success) return { ok: false as const, message: "There's no step to add." };

  const position = await db.planStep.count({ where: { hubId: hub.id, stage: s.data.stage } });
  const step = await db.planStep.create({ data: { hubId: hub.id, ...s.data, position, source: "AGENT" } });
  await db.agentMessage.update({ where: { id: msg.id }, data: { data: { ...data, addedStepId: step.id } as Prisma.InputJsonValue } });
  if (hub.stage === "IDEA" || hub.stage === "THESIS") await db.hub.update({ where: { id: hub.id }, data: { stage: "PLAN" } });
  revalidatePath(`/hubs/${hub.slug}`, "layout");
  return { ok: true as const, stepId: step.id };
}

/** "Ask SELF anything": pick the right hub agent, then open it with the question. */
export async function askSelf(question: string, hubId: string) {
  const viewer = await requireOnboarded();
  const q = z.string().trim().min(3, "Ask a real question.").max(2000).safeParse(question);
  if (!q.success) return { ok: false as const, message: q.error.issues[0].message };
  const { hub } = await requireHubAccessById(hubId, viewer);
  const routed = await runAgent(routerAgent, { question: q.data }, { userId: viewer.user.id, hubId: hub.id });
  const agent = routed.ok ? routed.output.agent : "strategy";
  redirect(`/hubs/${hub.slug}/agents/${agent}?q=${encodeURIComponent(q.data)}`);
}
