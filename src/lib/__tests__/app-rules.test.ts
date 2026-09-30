import { describe, expect, it } from "vitest";
import { applicationProblem, circleFor, hasOtherOwner, heirFor, circleName, dayOf, fitSentence, mayHost, mentorAskProblem, newInviteCode, normaliseCode, opportunityFit, opportunityProblem, pickProblem, requestProblem, weekOf } from "../app-rules";

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

describe("opportunityFit", () => {
  const o = { fields: ["FOOD"], stages: ["FIRST_CUSTOMERS"], buildingOnly: false, hostId: "h" };
  const maya = { id: "m", field: "FOOD", stage: "FIRST_CUSTOMERS", buildingLately: true };
  it("fits and says why, in words", () => {
    expect(opportunityFit(o, maya)).toEqual(["You build in food", "you're finding first customers"]);
    expect(fitSentence(opportunityFit({ ...o, buildingOnly: true }, maya)!)).toBe("You build in food, you're finding first customers and you've been building these last two weeks.");
  });
  it("doesn't fit other fields, stages, quiet members or the host", () => {
    expect(opportunityFit(o, { ...maya, field: "HEALTH" })).toBeNull();
    expect(opportunityFit(o, { ...maya, stage: "IDEA" })).toBeNull();
    expect(opportunityFit({ ...o, buildingOnly: true }, { ...maya, buildingLately: false })).toBeNull();
    expect(opportunityFit(o, { ...maya, id: "h" })).toBeNull();
  });
  it("open ones fit everyone", () => {
    expect(opportunityFit({ fields: [], stages: [], buildingOnly: false, hostId: "h" }, { id: "x", field: null, stage: null, buildingLately: false })).toEqual(["It's open to every member"]);
  });
});

describe("opportunity rules", () => {
  const now = new Date("2026-10-01T10:00:00Z");
  it("requests need a reason and an open, future opportunity", () => {
    const o = { startsAt: new Date("2026-10-10T19:00:00Z"), closedAt: null };
    expect(requestProblem(o, "I'm pricing trays for restaurants and want to learn.", now)).toBeNull();
    expect(requestProblem(o, "hi", now)).toMatch(/why/);
    expect(requestProblem({ ...o, closedAt: now }, "a long enough reason here", now)).toMatch(/isn't taking/);
    expect(requestProblem({ ...o, startsAt: now }, "a long enough reason here", now)).toMatch(/already happened/);
  });
  it("never overfills and never takes payments", () => {
    expect(pickProblem(8, 7)).toBeNull();
    expect(pickProblem(8, 8)).toMatch(/Every seat/);
    const base = { title: "Food founder dinner", description: "Eight food founders, one long table, no pitching.", seats: 8, startsAt: new Date("2026-10-10T19:00:00Z") };
    expect(opportunityProblem(base, now)).toBeNull();
    expect(opportunityProblem({ ...base, costNote: "€40, pay through SELF" }, now)).toMatch(/doesn't take payments/);
  });
  it("hosts are mentors, partners, backers or admins", () => {
    expect(mayHost(["MENTOR"])).toBe(true);
    expect(mayHost(["BUILDER"])).toBe(false);
  });
});

describe("heirFor", () => {
  const d = (n: number) => new Date(2026, 0, n);
  it("prefers owners, then admins, then members; oldest first; never guests", () => {
    const m = [
      { userId: "me", role: "OWNER", joinedAt: d(1) },
      { userId: "g", role: "GUEST", joinedAt: d(2) },
      { userId: "m1", role: "MEMBER", joinedAt: d(3) },
      { userId: "a2", role: "ADMIN", joinedAt: d(5) },
      { userId: "a1", role: "ADMIN", joinedAt: d(4) },
    ];
    expect(heirFor(m, "me")).toBe("a1");
    expect(heirFor(m.filter((x) => !x.userId.startsWith("a")), "me")).toBe("m1");
    expect(heirFor([m[0]!, m[1]!], "me")).toBeNull();
    expect(hasOtherOwner([...m, { userId: "o2", role: "OWNER", joinedAt: d(9) }], "me")).toBe(true);
    expect(hasOtherOwner(m, "me")).toBe(false);
  });
});
