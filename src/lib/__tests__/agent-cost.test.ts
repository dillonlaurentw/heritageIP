import { describe, expect, it } from "vitest";
import { formatTokens, formatUsd, groupCost, runCost } from "../agent-cost";

const run = (over: Partial<Parameters<typeof runCost>[0]> = {}) => ({
  model: "claude-opus-5",
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
  ...over,
});

describe("runCost", () => {
  it("prices input and output per million tokens", () => {
    expect(runCost(run({ inputTokens: 1_000_000 }))).toBe(5);
    expect(runCost(run({ outputTokens: 1_000_000 }))).toBe(25);
  });

  it("prices cache reads at 0.1x and cache writes at 1.25x input", () => {
    expect(runCost(run({ cacheReadTokens: 1_000_000 }))).toBeCloseTo(0.5);
    expect(runCost(run({ cacheWriteTokens: 1_000_000 }))).toBeCloseTo(6.25);
  });

  it("uses the most specific model price", () => {
    expect(runCost(run({ model: "claude-opus-5-5", inputTokens: 1_000_000 }))).toBe(4);
  });

  it("returns null for demo or unknown models", () => {
    expect(runCost(run({ model: "demo", inputTokens: 100 }))).toBeNull();
    expect(runCost(run({ model: "something-else" }))).toBeNull();
  });
});

describe("groupCost", () => {
  it("sums runs, tokens and cost per key, most expensive first", () => {
    const rows = groupCost(
      [
        { ...run({ inputTokens: 1000 }), who: "a" },
        { ...run({ outputTokens: 1000 }), who: "b" },
        { ...run({ inputTokens: 1000 }), who: "a" },
        { ...run({ model: "demo", inputTokens: 50 }), who: "c" },
      ],
      (r) => r.who,
    );
    expect(rows.map((r) => r.key)).toEqual(["b", "a", "c"]);
    expect(rows[1]).toMatchObject({ runs: 2, tokens: 2000 });
    expect(rows[1].cost).toBeCloseTo(0.01);
    expect(rows[2].cost).toBe(0);
  });
});

describe("formatting", () => {
  it("formats small costs and token counts readably", () => {
    expect(formatUsd(0)).toBe("$0");
    expect(formatUsd(0.004)).toBe("<$0.01");
    expect(formatUsd(1.234)).toBe("$1.23");
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(12_400)).toBe("12.4k");
    expect(formatTokens(3_200_000)).toBe("3.2M");
  });
});
