import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { db } from "@/lib/db";
import { anthropic } from "./client";
import { AGENT_MODEL, LIMITS, agentsLive } from "./config";
import type { AgentDef } from "./define";

export type AgentResult<T> =
  | { ok: true; output: T; demo: boolean }
  | { ok: false; reason: "capped" | "refused" | "error"; message: string };

type RunMeta = { userId: string; hubId?: string | null };

/** Calls today that count against the user's cap. */
export async function runsToday(userId: string) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  return db.agentRun.count({
    where: { userId, createdAt: { gte: since }, status: { in: ["OK", "REFUSED", "ERROR"] } },
  });
}

/**
 * The only way SELF calls a model. Checks the daily cap, calls Claude with a
 * structured-output schema, logs usage to AgentRun, and never throws: callers
 * get a typed result they can show.
 */
export async function runAgent<Ctx, Out extends z.ZodType>(
  agent: AgentDef<Ctx, Out>,
  ctx: Ctx,
  meta: RunMeta,
): Promise<AgentResult<z.infer<Out>>> {
  const log = (data: {
    status: "OK" | "DEMO" | "CAPPED" | "REFUSED" | "ERROR";
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    durationMs?: number;
    error?: string;
  }) =>
    db.agentRun.create({
      data: { userId: meta.userId, hubId: meta.hubId ?? null, purpose: agent.purpose, model: AGENT_MODEL, ...data },
    });

  // Demo mode: no key configured. Canned but realistic output, zero cost.
  if (!agentsLive()) {
    await log({ status: "DEMO", model: "demo" });
    return { ok: true, output: agent.demo(ctx), demo: true };
  }

  if ((await runsToday(meta.userId)) >= LIMITS.dailyRunsPerUser) {
    await log({ status: "CAPPED" });
    return {
      ok: false,
      reason: "capped",
      message: "You've hit today's limit for SELF's agents. It resets at midnight UTC.",
    };
  }

  const started = Date.now();
  try {
    const res = await anthropic().beta.messages.parse({
      model: AGENT_MODEL,
      max_tokens: LIMITS.maxTokens,
      // If Claude's safety classifiers decline, the API retries on
      // Anthropic's recommended fallback model instead of failing.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: agent.effort, format: betaZodOutputFormat(agent.schema) },
      system: agent.cacheSystem
        ? [{ type: "text", text: agent.system(ctx), cache_control: { type: "ephemeral" } }]
        : agent.system(ctx),
      messages: [{ role: "user", content: agent.prompt(ctx) }],
    });

    const usage = {
      model: res.model,
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      cacheReadTokens: res.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: res.usage.cache_creation_input_tokens ?? 0,
      durationMs: Date.now() - started,
    };

    if (res.stop_reason === "refusal") {
      await log({ status: "REFUSED", ...usage });
      return { ok: false, reason: "refused", message: "SELF couldn't help with that one. Try putting it another way." };
    }
    if (!res.parsed_output) {
      await log({ status: "ERROR", ...usage, error: `unparsed output (stop_reason=${res.stop_reason})` });
      return { ok: false, reason: "error", message: "That answer came back garbled. Try again." };
    }
    await log({ status: "OK", ...usage });
    return { ok: true, output: res.parsed_output as z.infer<Out>, demo: false };
  } catch (e) {
    const message =
      e instanceof Anthropic.AuthenticationError
        ? "SELF's AI key isn't working. If you run this SELF, check ANTHROPIC_API_KEY."
        : e instanceof Anthropic.RateLimitError
        ? "SELF is busy right now. Try again in a minute."
        : e instanceof Anthropic.APIConnectionError
          ? "Couldn't reach SELF's agents. Check the connection and try again."
          : "Something went wrong on our side. Try again.";
    await log({ status: "ERROR", durationMs: Date.now() - started, error: e instanceof Error ? e.message : String(e) });
    return { ok: false, reason: "error", message };
  }
}
