"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LIMITS, runAgent, thesisDraftAgent, thesisQuestionsAgent, type ThesisCtx } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { builderContext, requireOwnedHubId } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";
import { thesisInput, type ThesisInput } from "@/lib/thesis-schema";

const qaInput = z
  .array(z.object({ question: z.string().max(400), answer: z.string().max(2000) }))
  .max(LIMITS.thesisRounds * 3);

async function openThread(userId: string, hubId: string) {
  return (
    (await db.agentThread.findFirst({ where: { hubId, kind: "thesis" }, orderBy: { createdAt: "desc" } })) ??
    (await db.agentThread.create({ data: { userId, hubId, kind: "thesis" } }))
  );
}

async function setup(hubId: string, qa: unknown) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  const answers = qaInput.parse(qa);
  const thread = await openThread(viewer.user.id, hub.id);
  const rounds = await db.agentMessage.count({
    where: { threadId: thread.id, role: "AGENT", data: { path: ["type"], equals: "questions" } },
  });
  const ctx: ThesisCtx = {
    builder: builderContext(viewer),
    hubName: hub.name,
    rawIdea: hub.rawIdea,
    qa: answers,
    current: hub.thesis,
    round: rounds + 1,
    maxRounds: LIMITS.thesisRounds,
  };
  return { viewer, hub, thread, ctx, rounds };
}

/** Save the builder's latest answers (only the ones not stored yet). */
async function recordAnswers(threadId: string, qa: { question: string; answer: string }[], alreadyStored: number) {
  const fresh = qa.slice(alreadyStored);
  if (!fresh.length) return;
  await db.agentMessage.create({
    data: {
      threadId,
      role: "USER",
      text: fresh.map((q) => `${q.question}\n${q.answer}`).join("\n\n"),
      data: { type: "answers", answers: fresh } as Prisma.InputJsonValue,
    },
  });
}

async function storedAnswerCount(threadId: string) {
  const msgs = await db.agentMessage.findMany({
    where: { threadId, role: "USER" },
    select: { data: true },
  });
  return msgs.reduce((n, m) => n + (((m.data as { answers?: unknown[] } | null)?.answers?.length as number) ?? 0), 0);
}

export async function askQuestions(hubId: string, qa: unknown) {
  const { viewer, hub, thread, ctx, rounds } = await setup(hubId, qa);
  if (rounds >= LIMITS.thesisRounds) {
    return { ok: false as const, reason: "capped" as const, message: "That's all the rounds for this pass. Draft it, then start fresh if you want more." };
  }
  await recordAnswers(thread.id, ctx.qa, await storedAnswerCount(thread.id));
  const res = await runAgent(thesisQuestionsAgent, ctx, { userId: viewer.user.id, hubId: hub.id });
  if (res.ok) {
    await db.agentMessage.create({
      data: {
        threadId: thread.id,
        role: "AGENT",
        text: [res.output.reflection, ...res.output.questions].join("\n"),
        data: { type: "questions", round: ctx.round, ...res.output } as Prisma.InputJsonValue,
      },
    });
  }
  return res.ok ? { ...res, round: ctx.round } : res;
}

export async function draftThesis(hubId: string, qa: unknown) {
  const { viewer, hub, thread, ctx } = await setup(hubId, qa);
  await recordAnswers(thread.id, ctx.qa, await storedAnswerCount(thread.id));
  const res = await runAgent(thesisDraftAgent, ctx, { userId: viewer.user.id, hubId: hub.id });
  if (res.ok) {
    await db.agentMessage.create({
      data: {
        threadId: thread.id,
        role: "AGENT",
        text: res.output.statement,
        data: { type: "draft", ...res.output } as Prisma.InputJsonValue,
      },
    });
  }
  return res;
}

export async function saveThesis(hubId: string, input: ThesisInput, source: "AGENT" | "EDIT") {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  const parsed = thesisInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false as const, errors };
  }
  const data = parsed.data;
  await db.$transaction([
    db.thesis.upsert({ where: { hubId: hub.id }, create: { hubId: hub.id, ...data }, update: data }),
    db.thesisRevision.create({ data: { hubId: hub.id, source, snapshot: data } }),
    // Close the dialogue: the next "sharpen" starts a fresh thread.
    db.agentThread.create({ data: { userId: viewer.user.id, hubId: hub.id, kind: "thesis" } }),
    db.hub.update({
      where: { id: hub.id },
      data: {
        stage: hub.stage === "IDEA" ? "THESIS" : hub.stage,
        oneLiner: hub.oneLiner ?? data.statement.slice(0, 140),
      },
    }),
  ]);
  revalidatePath(`/hubs/${hub.slug}`);
  return { ok: true as const };
}

/** Start a fresh dialogue (keeps the old one for history). */
export async function newDialogue(hubId: string) {
  const viewer = await requireOnboarded();
  const hub = await requireOwnedHubId(hubId, viewer);
  await db.agentThread.create({ data: { userId: viewer.user.id, hubId: hub.id, kind: "thesis" } });
  revalidatePath(`/hubs/${hub.slug}/thesis`);
}
