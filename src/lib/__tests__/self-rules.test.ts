import { describe, expect, it } from "vitest";
import {
  applyStated,
  approvedCategories,
  consentProblem,
  contextLines,
  learnFromOutcome,
  mayRetrieve,
  mergeWithShared,
  rankContext,
  sharedPrefs,
  tokens,
  type Origin,
  type Pref,
} from "../self/rules";

const own: Origin = { service: "cadence", serviceName: "Cadence Outdoor", shared: false };
const fern: Origin = { service: "fernhill", serviceName: "Fernhill Home", shared: true };
const at = new Date("2026-09-01");
const pref = (p: Partial<Pref> & { category: string; value: string }): Pref => ({
  stance: "LIKES",
  source: "STATED",
  evidence: 1,
  lastEvidenceAt: at,
  ...p,
});

describe("consent", () => {
  it("needs personalization for anything and agents for AI agents", () => {
    expect(mayRetrieve({ personalization: false, agents: true }, "ai_agent")).toBe(false);
    expect(mayRetrieve({ personalization: true, agents: false }, "ai_agent")).toBe(false);
    expect(mayRetrieve({ personalization: true, agents: false }, "personalization")).toBe(true);
    expect(consentProblem({ personalization: true, agents: true }, "ai_agent")).toBeNull();
    expect(consentProblem({ personalization: false, agents: false }, "record")).toMatch(/personalization/);
  });
});

describe("tokens", () => {
  it("drops filler and singularizes", () => {
    expect(tokens("Looking for waterproof SHOES for the rain")).toEqual(["waterproof", "shoe", "rain"]);
  });
});

describe("rankContext", () => {
  const prefs = [
    { ...pref({ category: "material", value: "merino wool", evidence: 2 }), origin: own },
    { ...pref({ category: "material", value: "synthetic down", stance: "AVOIDS", source: "OBSERVED", evidence: 2 }), origin: own },
    { ...pref({ category: "fit", value: "shoe size eu 41" }), origin: own },
    { ...pref({ category: "color", value: "muted earth tones" }), origin: fern },
  ];

  it("returns what matters for the query, with reasons", () => {
    const r = rankContext({ query: "rain shoes for commuting", prefs });
    expect(r[0].value).toBe("shoe size eu 41");
    expect(r[0].reasons.join(" ")).toMatch(/shoe/);
    expect(r.find((i) => i.value === "muted earth tones")).toBeUndefined();
  });

  it("puts avoids first among equals", () => {
    const r = rankContext({ query: "a warm jacket", prefs });
    const materials = r.filter((i) => i.category === "material");
    expect(materials[0].stance).toBe("AVOIDS");
  });

  it("respects a category filter", () => {
    const r = rankContext({ prefs, categories: ["color"] });
    expect(r.map((i) => i.value)).toEqual(["muted earth tones"]);
  });

  it("falls back to stated preferences when nothing matches", () => {
    const r = rankContext({ query: "zzz qqq", prefs });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => i.source === "STATED")).toBe(true);
  });

  it("labels shared items in the prompt lines", () => {
    const lines = contextLines(rankContext({ prefs, categories: ["color"] }));
    expect(lines[0]).toMatch(/Shared from Fernhill Home/);
  });
});

describe("applyStated", () => {
  it("adds evidence when repeated and resets when the stance flips", () => {
    const e = pref({ category: "material", value: "linen", source: "OBSERVED", evidence: 3 });
    expect(applyStated(e, { category: "material", value: "Linen", stance: "LIKES" })).toMatchObject({ op: "update", evidence: 4, source: "STATED" });
    expect(applyStated(e, { category: "material", value: "linen", stance: "AVOIDS" })).toMatchObject({ evidence: 1, stance: "AVOIDS" });
    expect(applyStated(undefined, { category: "material", value: "  Wool ", stance: "LIKES" })).toMatchObject({ op: "create", value: "wool" });
  });
});

describe("learnFromOutcome", () => {
  const existing = [
    pref({ category: "material", value: "merino wool", source: "OBSERVED", evidence: 1 }),
    pref({ category: "color", value: "neon", stance: "AVOIDS", source: "STATED" }),
    pref({ category: "material", value: "gore-tex", stance: "AVOIDS", source: "OBSERVED", evidence: 2 }),
  ];

  it("strengthens and adds likes on a purchase", () => {
    const r = learnFromOutcome({
      result: "purchased",
      attributes: [
        { category: "material", value: "Merino Wool" },
        { category: "use", value: "cycling" },
      ],
      existing,
    });
    expect(r.changes.map((c) => c.change)).toEqual(["strengthened", "added"]);
    expect(r.writes[0]).toMatchObject({ op: "update", evidence: 2 });
  });

  it("never overrides what the customer said", () => {
    const r = learnFromOutcome({ result: "purchased", attributes: [{ category: "color", value: "neon" }], existing });
    expect(r.writes).toEqual([]);
    expect(r.changes[0].change).toBe("kept");
  });

  it("weakens an observed avoid, then removes it", () => {
    const r = learnFromOutcome({ result: "accepted", attributes: [{ category: "material", value: "gore-tex" }], existing });
    expect(r.changes[0].change).toBe("weakened");
    const r2 = learnFromOutcome({ result: "returned", because: [{ category: "material", value: "merino wool" }], attributes: [], existing });
    expect(r2.changes[0].change).toBe("removed");
    expect(r2.writes[0].op).toBe("delete");
  });

  it("learns nothing from a return without a reason, or from ignoring", () => {
    expect(learnFromOutcome({ result: "returned", attributes: [{ category: "material", value: "wool" }], existing }).writes).toEqual([]);
    expect(learnFromOutcome({ result: "ignored", attributes: [{ category: "material", value: "wool" }], existing }).writes).toEqual([]);
  });

  it("never learns values or beliefs from behaviour", () => {
    const r = learnFromOutcome({
      result: "purchased",
      attributes: [
        { category: "values", value: "buy less, buy better" },
        { category: "material", value: "wool" },
      ],
      existing,
    });
    expect(r.writes.map((w) => w.category)).toEqual(["material"]);
    expect(r.changes[0]).toMatchObject({ category: "values", change: "kept" });
  });

  it("adds an avoid for the named reason only", () => {
    const r = learnFromOutcome({
      result: "rejected",
      attributes: [
        { category: "material", value: "nylon" },
        { category: "color", value: "black" },
      ],
      because: [{ category: "color", value: "black" }],
      existing,
    });
    expect(r.changes).toHaveLength(1);
    expect(r.changes[0]).toMatchObject({ value: "black", stance: "AVOIDS", change: "added" });
  });
});

describe("sharing", () => {
  it("only active grants share, and only their categories", () => {
    const prefs = [pref({ category: "color", value: "clay" }), pref({ category: "fit", value: "m" })];
    expect(sharedPrefs({ status: "PENDING", categories: ["color"] }, prefs)).toEqual([]);
    expect(sharedPrefs({ status: "REVOKED", categories: ["color"] }, prefs)).toEqual([]);
    expect(sharedPrefs({ status: "ACTIVE", categories: ["color"] }, prefs).map((p) => p.value)).toEqual(["clay"]);
  });

  it("lets the customer narrow but never widen", () => {
    expect(approvedCategories(["color", "style"], ["style", "fit"])).toEqual(["style"]);
  });

  it("keeps the receiving service's own preference over a shared one", () => {
    const a = [{ ...pref({ category: "color", value: "clay" }), origin: own }];
    const b = [
      { ...pref({ category: "color", value: "clay", stance: "AVOIDS" }), origin: fern },
      { ...pref({ category: "color", value: "sage" }), origin: fern },
    ];
    const m = mergeWithShared(a, b);
    expect(m).toHaveLength(2);
    expect(m.find((p) => p.value === "clay")?.origin.shared).toBe(false);
  });
});
