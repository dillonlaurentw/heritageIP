import { describe, expect, it } from "vitest";
import { isWorkspaceAgent, routeByKeywords } from "../workspace-agents";

describe("routeByKeywords", () => {
  it("sends legal questions to the legal explainer", () => {
    expect(routeByKeywords("How does founder vesting work?")).toBe("legal");
    expect(routeByKeywords("Do we need a trademark?")).toBe("legal");
  });
  it("routes fundraising, ops and go-to-market", () => {
    expect(routeByKeywords("Practice my pitch for backers")).toBe("fundraising");
    expect(routeByKeywords("What should I ask our supplier?")).toBe("ops");
    expect(routeByKeywords("Which channel for our first customers?")).toBe("gtm");
  });
  it("falls back to strategy", () => {
    expect(routeByKeywords("What should we do next?")).toBe("strategy");
  });
});

describe("isWorkspaceAgent", () => {
  it("accepts only known agents", () => {
    expect(isWorkspaceAgent("legal")).toBe(true);
    expect(isWorkspaceAgent("lawyer")).toBe(false);
  });
});
