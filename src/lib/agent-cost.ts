/**
 * Estimated dollar cost of logged agent runs. Pure, so it's unit tested.
 *
 * Prices are Anthropic's list prices in USD per million tokens (checked
 * 2026-09). Cache reads bill at 0.1x input, 5-minute cache writes at 1.25x.
 * These are estimates for spotting trends; the Anthropic Console is the bill.
 */
export const PRICES_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export type RunUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

/** Cost of one run in USD, or null when the model has no known price (e.g. "demo"). */
export function runCost(r: RunUsage): number | null {
  // Responses can name a dated or suffixed id; match on the longest known prefix.
  const key = Object.keys(PRICES_PER_MTOK)
    .filter((k) => r.model === k || r.model.startsWith(`${k}-`) || r.model.startsWith(`${k}[`))
    .sort((a, b) => b.length - a.length)[0];
  if (!key) return null;
  const p = PRICES_PER_MTOK[key];
  return (
    (r.inputTokens * p.input +
      r.cacheReadTokens * p.input * 0.1 +
      r.cacheWriteTokens * p.input * 1.25 +
      r.outputTokens * p.output) /
    1_000_000
  );
}

export type CostRow = { key: string; runs: number; tokens: number; cost: number };

/** Group runs by a key (user, day, agent), summing tokens and cost. Sorted by cost, highest first. */
export function groupCost<T extends RunUsage>(runs: T[], keyOf: (r: T) => string): CostRow[] {
  const map = new Map<string, CostRow>();
  for (const r of runs) {
    const key = keyOf(r);
    const row = map.get(key) ?? { key, runs: 0, tokens: 0, cost: 0 };
    row.runs += 1;
    row.tokens += r.inputTokens + r.outputTokens + r.cacheReadTokens + r.cacheWriteTokens;
    row.cost += runCost(r) ?? 0;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.cost - a.cost || b.runs - a.runs);
}

export function formatUsd(n: number) {
  if (n === 0) return "$0";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

export function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
