import { describe, expect, it } from "vitest";
import { answerTrial, canMessage, canProposeTrial, orderForChair, pairKey, trialTitle, type TrialData } from "../message-rules";

describe("pairKey", () => {
  it("is the same in both directions and refuses talking to yourself", () => {
    expect(pairKey("b", "a")).toBe(pairKey("a", "b"));
    expect(() => pairKey("a", "a")).toThrow();
  });
});

describe("canMessage", () => {
  it("needs a shared company or an accepted request", () => {
    expect(canMessage({ sharedWorkspace: false, acceptedSignal: false })).toBe(false);
    expect(canMessage({ sharedWorkspace: true, acceptedSignal: false })).toBe(true);
    expect(canMessage({ sharedWorkspace: false, acceptedSignal: true })).toBe(true);
  });
});

describe("trial weeks", () => {
  const trial: TrialData = { workspaceId: "w", workspaceName: "Tidewater", title: "Brand", focus: "", status: "PENDING" };
  it("only owners and admins propose, and only to outsiders", () => {
    expect(canProposeTrial("MEMBER", false)).toMatch(/owners and admins/);
    expect(canProposeTrial("OWNER", true)).toMatch(/already/);
    expect(canProposeTrial("ADMIN", false)).toBeNull();
  });
  it("the other person answers; the proposer can only withdraw", () => {
    expect(answerTrial(trial, "joana", "maya", "accept")).toEqual({ ok: true, status: "ACCEPTED" });
    expect(answerTrial(trial, "maya", "maya", "accept").ok).toBe(false);
    expect(answerTrial(trial, "maya", "maya", "withdraw")).toEqual({ ok: true, status: "WITHDRAWN" });
    expect(answerTrial(trial, "joana", "maya", "withdraw").ok).toBe(false);
  });
  it("answered stays answered", () => {
    expect(answerTrial({ ...trial, status: "DECLINED" }, "joana", "maya", "accept").ok).toBe(false);
  });
  it("titles stay short", () => {
    expect(trialTitle("  Brand and story ")).toBe("Trial week: Brand and story");
    expect(trialTitle("x".repeat(200)).length).toBe(80);
  });
});

describe("orderForChair", () => {
  it("puts people whose strengths match the chair first, keeping order otherwise", () => {
    const people = [
      { id: "a", strengths: "Backend engineering", note: "" },
      { id: "b", strengths: "Brand identity and storytelling", note: "" },
      { id: "c", strengths: "Sales", note: "brand work part-time" },
    ];
    expect(orderForChair("Brand and story co-founder", people).map((p) => p.id)).toEqual(["b", "c", "a"]);
    expect(orderForChair("", people).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});
