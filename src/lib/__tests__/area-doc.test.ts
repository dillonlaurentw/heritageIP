import { describe, expect, it } from "vitest";
import { readSections, textToSectionBlocks, writeSection } from "../area-doc";
import { AREAS, AREA_KEYS, areasForNeeds } from "../areas";
import { B } from "../blocks";

const titles = ["Positioning", "First customers", "Channels"];

describe("area pages", () => {
  it("reads sections back, bullets as dashed lines, ignoring unknown headings", () => {
    const doc = [B.p("intro"), B.h2("Positioning"), B.p("Plastic-free trays."), B.h2("Notes"), B.p("skip me"), B.h2("Channels"), B.bullet("Association meeting"), B.bullet("Cost sheet")];
    expect(readSections(doc, titles)).toEqual({ Positioning: "Plastic-free trays.", "First customers": "", Channels: "- Association meeting\n- Cost sheet" });
  });

  it("replaces one section and leaves the rest alone", () => {
    const doc = [B.h2("Positioning"), B.p("old"), B.h2("Channels"), B.p("keep")];
    const next = writeSection(doc, titles, "Positioning", "New line\n- a bullet");
    expect(readSections(next, titles)).toEqual({ Positioning: "New line\n- a bullet", "First customers": "", Channels: "keep" });
  });

  it("adds a missing section in its place", () => {
    const doc = [B.h2("Positioning"), B.p("p"), B.h2("Channels"), B.p("c")];
    const next = writeSection(doc, titles, "First customers", "Processors") as { type: string }[];
    const heads = next.filter((b) => b.type === "heading");
    expect(heads).toHaveLength(3);
    expect(readSections(next, titles)["First customers"]).toBe("Processors");
    expect(next.findIndex((b) => b === heads[1])).toBe(2);
  });

  it("turns numbered and dashed lines into bullets", () => {
    expect(textToSectionBlocks("1. one\n- two\nthree").map((b) => b.type)).toEqual(["bulletListItem", "bulletListItem", "paragraph"]);
  });
});

describe("areas", () => {
  it("every area has sections and a working agent", () => {
    for (const k of AREA_KEYS) {
      expect(AREAS[k].sections.length).toBeGreaterThan(1);
      expect(AREAS[k].key).toBe(k);
    }
  });
  it("maps plan needs to areas", () => {
    expect(areasForNeeds(["LEGAL"])).toEqual(["legal"]);
    expect(areasForNeeds(["DESIGN"])).toEqual(["marketing", "product"]);
    expect(areasForNeeds([])).toEqual([]);
  });
});
