import { describe, expect, it } from "vitest";
import { checkParticipants, shouldStop, speakerIndex } from "../simulation-rules";

const base = {
  initiatorId: "maya",
  optedIn: new Set(["maya", "dev", "lena", "tomas", "ana"]),
  eligible: new Set(["dev", "lena", "tomas", "ana", "kwame"]),
};

describe("simulation participants", () => {
  it("accepts an opted-in, connected group", () => {
    expect(checkParticipants({ ...base, participantIds: ["maya", "dev", "lena"] })).toBeNull();
  });
  it("requires the initiator and at least one other", () => {
    expect(checkParticipants({ ...base, participantIds: ["dev", "lena"] })).toMatch(/always in/);
    expect(checkParticipants({ ...base, participantIds: ["maya"] })).toMatch(/at least one/);
  });
  it("caps the group at four", () => {
    expect(checkParticipants({ ...base, participantIds: ["maya", "dev", "lena", "tomas", "ana"] })).toMatch(/Up to 4/);
  });
  it("requires everyone's opt-in, including the initiator's", () => {
    expect(checkParticipants({ ...base, participantIds: ["maya", "kwame"] })).toMatch(/opted in/);
    expect(checkParticipants({ ...base, optedIn: new Set(["dev"]), participantIds: ["maya", "dev"] })).toMatch(/your own agent/);
  });
  it("only allows people you're connected to", () => {
    expect(checkParticipants({ ...base, optedIn: new Set([...base.optedIn, "stranger"]), participantIds: ["maya", "stranger"] })).toMatch(/connected/);
  });
});

describe("turns", () => {
  it("rotates speakers", () => {
    expect([0, 1, 2, 3, 4].map((t) => speakerIndex(t, 3))).toEqual([0, 1, 2, 0, 1]);
  });
  it("stops at the cap, or early only after two rounds", () => {
    expect(shouldStop(12, 12, 3, false)).toBe(true);
    expect(shouldStop(4, 12, 3, true)).toBe(false);
    expect(shouldStop(6, 12, 3, true)).toBe(true);
    expect(shouldStop(6, 12, 3, false)).toBe(false);
  });
});
