"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gamePlanAgent, ideasAgent, LIMITS, runAgent, thesisDraftAgent, thesisQuestionsAgent, type ThesisCtx } from "@/agents";
import type { Prisma } from "@/generated/prisma/client";
import { builderContext } from "@/lib/builder";
import { db } from "@/lib/db";
import { NEED_TAGS } from "@/lib/needs";
import { pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { applyPlan, doneSteps, readThesis, saveThesisPage } from "@/lib/thesis";
import { thesisInput, type ThesisInput } from "@/lib/thesis-doc";
import { requireWorkspaceRole } from "@/lib/workspaces";

const id = z.string().min(1).max(64);
const qaInput = z.array(z.object({ question: z.string().max(400), answer: z.string().max(2000) })).max(LIMITS.thesisRounds * 3);

async function openThread(userId: string, workspaceId: string) {
  return (
    (await db.agentThread.findFirst({ where: { workspaceId, kind: "thesis" }, orderBy: { createdAt: "desc" } })) ??
    (await db.agentThread.create({ data: { userId, workspaceId, kind: "thesis" } }))
  );
}

async function setup(workspaceId: string, qa: unknown) {
  const viewer = await requireOnboarded();
  await requireWorkspaceRole(id.parse(workspaceId), viewer, "MEMBER");
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const answers = qaInput.parse(qa);
  const thread = await openThread(viewer.user.id, ws.id);
  const rounds = await db.agentMessage.count({ where: { threadId: thread.id, role: "AGENT", data: { path: ["type"], equals: "questions" } } });
  const ctx: ThesisCtx = {
    builder: builderContext(viewer),
    companyName: ws.name,
    rawIdea: ws.rawIdea || ws.oneLiner || ws.name,
    qa: answers,
    current: await readThesis(ws.id),
    round: rounds + 1,
    maxRounds: LIMITS.thesisRounds,
  };
  return { viewer, ws, thread, ctx, rounds };
}

async function storedAnswerCount(threadId: string) {
  const msgs = await db.agentMessage.findMany({ where: { threadId, role: "USER" }, select: { data: true } });
  return msgs.reduce((n, m) => n + ((m.data as { answers?: unknown[] } | null)?.answers?.length ?? 0), 0);
}

/** Save the builder's latest answers (only the ones not stored yet). */
async function recordAnswers(threadId: string, qa: { question: string; answer: string }[]) {
  const fresh = qa.slice(await storedAnswerCount(threadId));
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

export async function askQuestions(workspaceId: string, qa: unknown) {
  const { viewer, ws, thread, ctx, rounds } = await setup(workspaceId, qa);
  if (rounds >= LIMITS.thesisRounds) {
    return { ok: false as const, reason: "capped" as const, message: "That's all the rounds for this pass. Draft it, then start fresh if you want more." };
  }
  await recordAnswers(thread.id, ctx.qa);
  const res = await runAgent(thesisQuestionsAgent, ctx, { userId: viewer.user.id, workspaceId: ws.id });
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

export async function draftThesis(workspaceId: string, qa: unknown) {
  const { viewer, ws, thread, ctx } = await setup(workspaceId, qa);
  await recordAnswers(thread.id, ctx.qa);
  const res = await runAgent(thesisDraftAgent, ctx, { userId: viewer.user.id, workspaceId: ws.id });
  if (res.ok) {
    await db.agentMessage.create({
      data: { threadId: thread.id, role: "AGENT", text: res.output.statement, data: { type: "draft", ...res.output } as Prisma.InputJsonValue },
    });
  }
  return res;
}

/** "Use this": write the thesis page. Starts a fresh dialogue for next time. */
export async function saveThesis(workspaceId: string, input: ThesisInput) {
  const viewer = await requireOnboarded();
  const parsed = thesisInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false as const, errors };
  }
  const pageId = await saveThesisPage(id.parse(workspaceId), parsed.data, viewer);
  await db.agentThread.create({ data: { userId: viewer.user.id, workspaceId, kind: "thesis" } });
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { slug: true } });
  revalidatePath("/", "layout");
  return { ok: true as const, href: pageHref(ws.slug, pageId) };
}

export async function newDialogue(workspaceId: string) {
  const viewer = await requireOnboarded();
  await requireWorkspaceRole(id.parse(workspaceId), viewer, "MEMBER");
  await db.agentThread.create({ data: { userId: viewer.user.id, workspaceId, kind: "thesis" } });
  revalidatePath("/", "layout");
}

/** Propose a game plan from the thesis. Saves nothing: the builder decides. */
export async function proposePlan(workspaceId: string) {
  const viewer = await requireOnboarded();
  await requireWorkspaceRole(id.parse(workspaceId), viewer, "MEMBER");
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  const thesis = await readThesis(ws.id);
  if (!thesis) return { ok: false as const, reason: "error" as const, message: "Write the thesis first: the plan is built from it." };
  return runAgent(
    gamePlanAgent,
    { builder: builderContext(viewer), companyName: ws.name, thesis, done: await doneSteps(ws.id) },
    { userId: viewer.user.id, workspaceId: ws.id },
  );
}

const stepsInput = z
  .array(
    z.object({
      stage: z.enum(["VALIDATE", "SETUP", "BUILD", "LAUNCH"]),
      title: z.string().trim().min(1).max(200),
      detail: z.string().max(1000),
      needs: z.array(z.enum(NEED_TAGS)).max(10),
    }),
  )
  .min(1, "Keep at least one step.")
  .max(40);

export async function acceptPlan(workspaceId: string, steps: unknown) {
  const viewer = await requireOnboarded();
  const parsed = stepsInput.safeParse(steps);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
  const plan = await applyPlan(id.parse(workspaceId), parsed.data, viewer);
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { slug: true } });
  revalidatePath("/", "layout");
  return { ok: true as const, href: pageHref(ws.slug, plan.id) };
}

/** "Help me find an idea": ideas from the builder's own profile. */
export async function generateIdeas(steer: string) {
  const viewer = await requireOnboarded();
  return runAgent(ideasAgent, { builder: builderContext(viewer), steer: z.string().max(300).parse(steer).trim() || undefined }, { userId: viewer.user.id });
}
