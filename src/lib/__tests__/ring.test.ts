import { describe, expect, it } from "vitest";
import { ARC_GAP, arcAngles, initials, layoutRing, MAX_PER_ARC, THEME_ARC, themeSummary, THEMES, type RingNode } from "../ring";

const node = (id: string, theme: RingNode["theme"], state: RingNode["state"] = "linked"): RingNode => ({
  id,
  theme,
  state,
  kind: state === "open" ? "open" : "person",
  name: `Person ${id}`,
  note: "",
});

describe("arcAngles", () => {
  it("keeps every node inside its own quarter, clear of the gaps", () => {
    for (const t of THEMES) {
      const [a, b] = THEME_ARC[t];
      for (const n of [1, 2, 5]) {
        for (const deg of arcAngles(t, n)) {
          expect(deg).toBeGreaterThan(a + ARC_GAP);
          expect(deg).toBeLessThan(b - ARC_GAP);
        }
      }
    }
  });
  it("centres a single node and spaces several evenly", () => {
    expect(arcAngles("ADVISORS", 1)).toEqual([45]);
    const three = arcAngles("PARTNERS", 3);
    expect(three[1]! - three[0]!).toBeCloseTo(three[2]! - three[1]!);
    expect(arcAngles("CAPITAL", 0)).toEqual([]);
  });
});

describe("layoutRing", () => {
  it("puts linked people first and open chairs last in an arc", () => {
    const { placed } = layoutRing([node("o", "COFOUNDERS", "open"), node("p", "COFOUNDERS", "pending"), node("l", "COFOUNDERS")], 0, 0, 100);
    expect(placed.map((p) => p.id)).toEqual(["l", "p", "o"]);
  });
  it("folds extra nodes into an overflow count instead of dropping them", () => {
    const many = Array.from({ length: MAX_PER_ARC + 3 }, (_, i) => node(String(i), "PARTNERS"));
    const { placed, overflow } = layoutRing(many, 0, 0, 100);
    expect(placed).toHaveLength(MAX_PER_ARC);
    expect(overflow.PARTNERS).toBe(3);
    expect(overflow.CAPITAL).toBe(0);
  });
  it("places co-founders top-left and advisors bottom-right", () => {
    const { placed } = layoutRing([node("c", "COFOUNDERS"), node("a", "ADVISORS")], 0, 0, 100);
    const c = placed.find((p) => p.id === "c")!;
    const a = placed.find((p) => p.id === "a")!;
    expect(c.x).toBeLessThan(0);
    expect(c.y).toBeLessThan(0);
    expect(a.x).toBeGreaterThan(0);
    expect(a.y).toBeGreaterThan(0);
  });
});

describe("themeSummary", () => {
  it("reads like a sentence", () => {
    const nodes = [node("1", "COFOUNDERS"), node("2", "COFOUNDERS"), node("3", "COFOUNDERS", "open")];
    expect(themeSummary("COFOUNDERS", nodes)).toBe("2 with you · 1 open chair");
    expect(themeSummary("CAPITAL", nodes)).toBe("Later, not first");
  });
});

describe("initials", () => {
  it("handles firms and people", () => {
    expect(initials("Dev Raman")).toBe("DR");
    expect(initials("Harbor & Vine")).toBe("HV");
    expect(initials("  ")).toBe("?");
  });
});
