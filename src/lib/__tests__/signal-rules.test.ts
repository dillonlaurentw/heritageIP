import { describe, expect, it } from "vitest";
import { nextStatus, revealsContact } from "../signal-rules";

const pending = { status: "PENDING" as const, fromUserId: "ana", toUserId: "maya" };

describe("signal state machine", () => {
  it("lets the recipient accept or decline", () => {
    expect(nextStatus(pending, "accept", "maya")).toEqual({ ok: true, status: "ACCEPTED" });
    expect(nextStatus(pending, "decline", "maya")).toEqual({ ok: true, status: "DECLINED" });
  });

  it("stops the sender answering their own signal", () => {
    expect(nextStatus(pending, "accept", "ana").ok).toBe(false);
  });

  it("stops strangers doing anything", () => {
    expect(nextStatus(pending, "accept", "kwame").ok).toBe(false);
    expect(nextStatus(pending, "withdraw", "kwame").ok).toBe(false);
  });

  it("lets only the sender withdraw", () => {
    expect(nextStatus(pending, "withdraw", "ana")).toEqual({ ok: true, status: "WITHDRAWN" });
    expect(nextStatus(pending, "withdraw", "maya").ok).toBe(false);
  });

  it("never moves out of a final state", () => {
    for (const status of ["ACCEPTED", "DECLINED", "WITHDRAWN"] as const) {
      expect(nextStatus({ ...pending, status }, "accept", "maya").ok).toBe(false);
      expect(nextStatus({ ...pending, status }, "withdraw", "ana").ok).toBe(false);
    }
  });
});

describe("contact reveal", () => {
  const accepted = { ...pending, status: "ACCEPTED" as const };

  it("reveals only on accepted signals, both directions", () => {
    expect(revealsContact(accepted, "ana", "maya")).toBe(true);
    expect(revealsContact(accepted, "maya", "ana")).toBe(true);
    expect(revealsContact(pending, "maya", "ana")).toBe(false);
    expect(revealsContact({ ...pending, status: "DECLINED" }, "maya", "ana")).toBe(false);
  });

  it("never reveals to a third person", () => {
    expect(revealsContact(accepted, "kwame", "ana")).toBe(false);
    expect(revealsContact(accepted, "maya", "kwame")).toBe(false);
  });
});
