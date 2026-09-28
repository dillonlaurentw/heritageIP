import { describe, expect, it } from "vitest";
import { B, blocksToText, openTodos, textToBlocks } from "../blocks";

describe("blocksToText", () => {
  it("collects text from nested blocks and links", () => {
    const doc = [
      B.h1("Thesis"),
      { type: "paragraph", content: [{ type: "text", text: "See " }, { type: "link", href: "x", content: [{ type: "text", text: "notes" }] }], children: [B.p("inner")] },
    ];
    expect(blocksToText(doc)).toBe("Thesis See notes inner");
  });
  it("handles empty and junk input", () => {
    expect(blocksToText(null)).toBe("");
    expect(blocksToText("nope")).toBe("");
  });
});

describe("textToBlocks", () => {
  it("turns lines into paragraphs, bullets and to-dos", () => {
    const bs = textToBlocks("Intro\n- one\n[ ] call Ana\n[x] done");
    expect(bs.map((b) => b.type)).toEqual(["paragraph", "bulletListItem", "checkListItem", "checkListItem"]);
    expect(bs[3].props).toEqual({ checked: true });
  });
});

describe("openTodos", () => {
  it("returns only unchecked to-dos, including nested ones", () => {
    const doc = [B.todo("Send deck"), B.todo("Old", true), { ...B.p("x"), children: [B.todo("Nested")] }];
    expect(openTodos(doc).map((t) => t.text)).toEqual(["Send deck", "Nested"]);
  });
});
