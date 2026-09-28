/**
 * Every AI knob in one place. Change these, not the call sites.
 *
 * Model: Claude Opus 5 everywhere for now. To trade quality for cost on a
 * specific agent, lower its `effort` first (cheaper, same model); switching
 * model is the bigger lever and a product decision.
 */
export const AGENT_MODEL = "claude-opus-5";

export const LIMITS = {
  /** Agent calls per user per UTC day (demo runs don't count). */
  dailyRunsPerUser: Number(process.env.AGENT_DAILY_RUNS ?? 40),
  /** Question rounds in one thesis dialogue before it must draft. */
  thesisRounds: 3,
  /** Output ceiling per call. Structured answers here are short. */
  maxTokens: 16000,
} as const;

/** True when a real API key is configured. Otherwise agents run in demo mode. */
export const agentsLive = () => Boolean(process.env.ANTHROPIC_API_KEY);
