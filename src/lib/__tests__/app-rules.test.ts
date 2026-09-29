import { describe, expect, it } from "vitest";
import { applicationProblem, bookingProblem, circleToJoin, newInviteCode, normaliseCode, weekOf } from "../app-rules";

describe("weekOf", () => {
  it("returns the Monday of the week", () => {
    expect(weekOf(new Date("2026-10-01T15:00:00Z")).toISOString()).toBe("2026-09-28T00:00:00.000Z"); // Thursday
    expect(weekOf(new Date("2026-09-28T00:00:00Z")).toISOString()).toBe("2026-09-28T00:00:00.000Z"); // Monday
    expect(weekOf(new Date("2026-10-04T23:00:00Z")).toISOString()).toBe("2026-09-28T00:00:00.000Z"); // Sunday
  });
});

describe("invite codes", () => {
  it("look like SELF-XXXX-XXXX with no confusable letters", () => {
    const code = newInviteCode();
    expect(code).toMatch(/^SELF-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code.slice(5)).not.toMatch(/[01OIL]/);
  });
  it("accept what people actually type", () => {
    expect(normaliseCode(" self abcd efgh ")).toBe("SELF-ABCD-EFGH");
    expect(normaliseCode("abcdefgh")).toBe("SELF-ABCD-EFGH");
    expect(normaliseCode("SELF-ABC")).toBeNull();
  });
});

describe("circleToJoin", () => {
  it("fills the fullest circle with room first", () => {
    expect(circleToJoin([{ id: "a", size: 2 }, { id: "b", size: 5 }, { id: "c", size: 6 }])).toBe("b");
    expect(circleToJoin([{ id: "c", size: 6 }])).toBeNull();
    expect(circleToJoin([])).toBeNull();
  });
});

describe("bookingProblem", () => {
  const now = new Date("2026-10-01T10:00:00Z");
  const slot = { mentorId: "m", startsAt: new Date("2026-10-02T10:00:00Z"), bookedById: null };
  it("allows a free, future slot", () => {
    expect(bookingProblem(slot, "f", now, false)).toBeNull();
  });
  it("refuses own, taken, past, and a second slot with the same mentor", () => {
    expect(bookingProblem(slot, "m", now, false)).toMatch(/own/);
    expect(bookingProblem({ ...slot, bookedById: "x" }, "f", now, false)).toMatch(/just booked/);
    expect(bookingProblem({ ...slot, startsAt: now }, "f", now, false)).toMatch(/passed/);
    expect(bookingProblem(slot, "f", now, true)).toMatch(/one at a time/);
  });
});

describe("applicationProblem", () => {
  it("asks for real answers", () => {
    expect(applicationProblem({ building: "short", lastWeek: "x".repeat(30) })).toMatch(/building/);
    expect(applicationProblem({ building: "x".repeat(30), lastWeek: "" })).toMatch(/last week/);
    expect(applicationProblem({ building: "x".repeat(30), lastWeek: "y".repeat(30) })).toBeNull();
  });
});
