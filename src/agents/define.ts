import type { z } from "zod";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/**
 * An agent is: a purpose (for logs), an output schema, prompts built from
 * typed context, and a demo answer used when no API key is set.
 */
export type AgentDef<Ctx, Out extends z.ZodType> = {
  purpose: string;
  effort: Effort;
  schema: Out;
  system: (ctx: Ctx) => string;
  prompt: (ctx: Ctx) => string;
  demo: (ctx: Ctx) => z.infer<Out>;
};

export const defineAgent = <Ctx, Out extends z.ZodType>(def: AgentDef<Ctx, Out>) => def;
