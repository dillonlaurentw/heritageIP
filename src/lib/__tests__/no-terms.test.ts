import { describe, expect, it } from "vitest";
import { mentionsTerms } from "../no-terms";

describe("no-terms guard", () => {
  it("catches amounts, valuations and deal terms", () => {
    for (const t of [
      "Raising $500k to finish the pilot",
      "We're raising 750k",
      "I'd invest €50,000",
      "Happy to write a cheque of 25k",
      "At a $5m valuation cap",
      "Pre-money 4M",
      "Looking at a SAFE",
      "Offering 10% equity",
      "a 5 % stake for the right partner",
      "Convertible note preferred",
    ]) {
      expect(mentionsTerms(t), t).not.toBeNull();
    }
  });

  it("lets normal backer language through", () => {
    for (const t of [
      "Operators who know EU food retail and grants",
      "Intros to supermarket buyers in Iberia",
      "Help splitting equity fairly between co-founders",
      "We have 3 letters of intent and 40 processors in the region",
      "I back first-time founders who have felt the problem",
      "Pilot runs for 4 weeks with 30 trays a day",
    ]) {
      expect(mentionsTerms(t), t).toBeNull();
    }
  });
});
