import { describe, expect, it } from "vitest";
import { move, normalize, progress, type Ordered } from "../plan-order";

const steps: Ordered[] = [
  { id: "a", stage: "VALIDATE", position: 0 },
  { id: "b", stage: "VALIDATE", position: 1 },
  { id: "c", stage: "SETUP", position: 0 },
  { id: "d", stage: "BUILD", position: 5 },
  { id: "e", stage: "BUILD", position: 9 },
];

const ids = (s: Ordered[]) => s.map((x) => `${x.id}:${x.stage}:${x.position}`);

describe("plan ordering", () => {
  it("normalizes positions per stage", () => {
    expect(ids(normalize(steps))).toEqual(["a:VALIDATE:0", "b:VALIDATE:1", "c:SETUP:0", "d:BUILD:0", "e:BUILD:1"]);
  });

  it("swaps within a stage", () => {
    expect(ids(move(steps, "b", "up")).slice(0, 2)).toEqual(["b:VALIDATE:0", "a:VALIDATE:1"]);
    expect(ids(move(steps, "d", "down")).slice(3)).toEqual(["e:BUILD:0", "d:BUILD:1"]);
  });

  it("crosses into the next stage at the edge", () => {
    expect(ids(move(steps, "b", "down"))).toEqual(["a:VALIDATE:0", "b:SETUP:0", "c:SETUP:1", "d:BUILD:0", "e:BUILD:1"]);
    expect(ids(move(steps, "d", "up"))).toEqual(["a:VALIDATE:0", "b:VALIDATE:1", "c:SETUP:0", "d:SETUP:1", "e:BUILD:0"]);
  });

  it("crosses into an empty stage", () => {
    expect(ids(move(steps, "e", "down")).at(-1)).toBe("e:LAUNCH:0");
  });

  it("does nothing at the very ends", () => {
    expect(ids(move(steps, "a", "up"))).toEqual(ids(normalize(steps)));
    const last = move(steps, "e", "down");
    expect(ids(move(last, "e", "down"))).toEqual(ids(last));
  });

  it("counts progress", () => {
    expect(progress([{ doneAt: new Date() }, { doneAt: null }, { doneAt: null }])).toEqual({ done: 1, total: 3 });
  });
});
