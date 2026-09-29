import { describe, expect, it } from "vitest";
import { changesToApply, resolveSlips, whatIfIdeas } from "../what-if-rules";

describe("whatIfIdeas", () => {
  it("starts from the plan, at most four", () => {
    const ideas = whatIfIdeas([
      { title: "Contract a kelp press", needs: ["SUPPLIER"], done: false },
      { title: "Find a brand co-founder", needs: ["COFOUNDER"], done: false },
    ]);
    expect(ideas[0]).toBe("“Contract a kelp press” takes twice as long");
    expect(ideas).toContain("The co-founder you want can only give three days a week");
    expect(ideas.length).toBeLessThanOrEqual(4);
  });
  it("skips finished steps", () => {
    expect(whatIfIdeas([{ title: "Done thing", needs: ["LEGAL"], done: true }])[0]).toBe("The first customer says no");
  });
});

describe("resolveSlips", () => {
  it("maps numbers to steps and drops unknown or repeated ones", () => {
    const steps = [
      { n: 1, id: "a", title: "A" },
      { n: 2, id: "b", title: "B" },
    ];
    expect(resolveSlips(steps, [{ step: 2, effect: "late" }, { step: 9, effect: "x" }, { step: 2, effect: "dup" }])).toEqual([{ stepId: "b", title: "B", effect: "late" }]);
  });
});

describe("changesToApply", () => {
  it("only valid, new indexes, once each", () => {
    expect(changesToApply(3, [0], [0, 1, 1, 5, -1, 2])).toEqual([1, 2]);
  });
});
