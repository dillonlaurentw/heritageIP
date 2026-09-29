import { describe, expect, it } from "vitest";
import { applicationProblem, circleFor, circleName, dayOf, mentorAskProblem, newInviteCode, normaliseCode, weekOf } from "../app-rules";

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

describe("circleFor", () => {
  const c = (id: string, field: string | null, stage: string | null, size: number) => ({ id, field, stage, size });
  it("prefers the same field and stage, fullest first", () => {
    const circles = [c("a", "FOOD", "IDEA", 2), c("b", "FOOD", "FIRST_CUSTOMERS", 3), c("d", "FOOD", "FIRST_CUSTOMERS", 5)];
    expect(circleFor({ field: "FOOD", stage: "FIRST_CUSTOMERS" }, circles)).toBe("d");
  });
  it("falls back to the same field, then to a new circle", () => {
    const circles = [c("a", "FOOD", "IDEA", 2), c("x", "HEALTH", "GROWING", 3)];
    expect(circleFor({ field: "FOOD", stage: "GROWING" }, circles)).toBe("a");
    expect(circleFor({ field: "CLIMATE", stage: "IDEA" }, circles)).toBeNull();
    expect(circleFor({ field: null, stage: null }, circles)).toBeNull();
  });
  it("never overfills", () => {
    expect(circleFor({ field: "FOOD", stage: "IDEA" }, [c("a", "FOOD", "IDEA", 6)])).toBeNull();
  });
});

describe("circleName", () => {
  it("names a circle after what members share", () => {
    expect(circleName("FOOD", "FIRST_CUSTOMERS")).toBe("Food founders · first customers");
    expect(circleName("CLIMATE", null)).toBe("Climate founders");
    expect(circleName(null, null)).toBe("Founders");
  });
});

describe("mentorAskProblem", () => {
  it("asks for a real note", () => {
    expect(mentorAskProblem("hi")).toMatch(/what you'd like help/);
    expect(mentorAskProblem("I'm building kelp trays and stuck on pricing.")).toBeNull();
  });
});

describe("dayOf", () => {
  it("is the UTC date", () => {
    expect(dayOf(new Date("2026-10-01T23:30:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
});

describe("applicationProblem", () => {
  it("asks for real answers", () => {
    expect(applicationProblem({ building: "short", lastWeek: "x".repeat(30) })).toMatch(/building/);
    expect(applicationProblem({ building: "x".repeat(30), lastWeek: "" })).toMatch(/last week/);
    expect(applicationProblem({ building: "x".repeat(30), lastWeek: "y".repeat(30) })).toBeNull();
  });
});
