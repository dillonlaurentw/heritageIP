import { describe, expect, it } from "vitest";
import { B } from "../blocks";
import { hasThesis, thesisFromBlocks, thesisToBlocks, type ThesisInput } from "../thesis-doc";

const t: ThesisInput = {
  statement: "Coastal producers will switch to kelp trays.",
  problem: "Plastic trays cost more every year.",
  audience: "Seafood processors near Peniche.",
  whyNow: "EU rules tighten in 2027.",
  whyUs: "Maya ran cold-chain logistics.",
  contrarian: "The cost is logistics, not material.",
  openQuestions: ["Do trays survive 48h on ice?", "Will processors pre-commit?"],
};

describe("thesis document", () => {
  it("round-trips through page blocks", () => {
    expect(thesisFromBlocks(thesisToBlocks(t))).toEqual(t);
  });

  it("reads a page the builder edited: extra paragraphs join, unknown headings are ignored", () => {
    const doc = [...thesisToBlocks(t), B.h2("Scratch"), B.p("ignore me")];
    doc.splice(3, 0, B.p("Freight is 11% of landed cost."));
    const back = thesisFromBlocks(doc);
    expect(back.problem).toBe("Plastic trays cost more every year.\nFreight is 11% of landed cost.");
    expect(back.contrarian).toBe(t.contrarian);
    expect(hasThesis(back)).toBe(true);
  });

  it("handles empty pages", () => {
    expect(hasThesis(thesisFromBlocks([]))).toBe(false);
  });
});
