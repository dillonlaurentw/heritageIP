import { describe, expect, it } from "vitest";
import { addSuggestions, applySelfOp, LINES_PER_FACET, parseSelfDoc, renderPersona, selfFromOnboarding, type SelfDoc } from "../self-doc";

const NOW = "2026-09-30T10:00:00.000Z";
const ids = () => {
  let n = 0;
  return () => `id${++n}`;
};

describe("selfFromOnboarding", () => {
  it("turns answers into lines, word for word, and skips blanks", () => {
    const doc = selfFromOnboarding({ beliefs: "  Logistics  is the real cost. ", strengths: "ops", gaps: "", buildingToward: null }, NOW, ids());
    expect(doc.lines.map((l) => [l.facet, l.text, l.source])).toEqual([
      ["BELIEVE", "Logistics is the real cost.", "onboarding"],
      ["STRENGTHS", "Strong at: ops", "onboarding"],
    ]);
    expect(doc.suggestions).toEqual([]);
  });
});

describe("renderPersona", () => {
  it("uses only the lines, grouped by section", () => {
    const doc: SelfDoc = {
      lines: [
        { id: "a", facet: "TOWARD", text: "A company the coast is proud of", source: "you", edited: false, at: NOW },
        { id: "b", facet: "BELIEVE", text: "Logistics is the real cost.", source: "onboarding", edited: false, at: NOW },
      ],
      suggestions: [{ id: "s", facet: "NONNEG", text: "Never offshore", why: "", status: "PENDING", at: NOW }],
    };
    const text = renderPersona("Maya Okonkwo", doc, "Ex-shipping ops lead.");
    expect(text).toBe("Maya: Ex-shipping ops lead.\nBelieves: Logistics is the real cost.\nBuilding toward: A company the coast is proud of.");
    expect(text).not.toContain("offshore");
  });
});

describe("applySelfOp", () => {
  const base = selfFromOnboarding({ beliefs: "B" }, NOW, ids());

  it("adds, edits and removes lines without touching the original", () => {
    const id = ids();
    const added = applySelfOp(base, { type: "add", facet: "WHY", text: "My town" }, NOW, id);
    expect(added.ok && added.doc.lines.at(-1)).toMatchObject({ facet: "WHY", text: "My town", source: "you" });
    expect(base.lines).toHaveLength(1);
    const line = base.lines[0]!;
    const edited = applySelfOp(base, { type: "edit", id: line.id, text: "Better" }, NOW, id);
    expect(edited.ok && edited.doc.lines[0]).toMatchObject({ text: "Better", edited: true, source: "onboarding" });
    const removed = applySelfOp(base, { type: "remove", id: line.id }, NOW, id);
    expect(removed.ok && removed.doc.lines).toEqual([]);
  });

  it("refuses empty, missing and overfull", () => {
    expect(applySelfOp(base, { type: "add", facet: "WHY", text: "   " }, NOW, ids()).ok).toBe(false);
    expect(applySelfOp(base, { type: "edit", id: "nope", text: "x" }, NOW, ids()).ok).toBe(false);
    let doc = base;
    for (let i = 0; i < LINES_PER_FACET; i++) {
      const r = applySelfOp(doc, { type: "add", facet: "WHY", text: `line ${i}` }, NOW, ids());
      if (r.ok) doc = r.doc;
    }
    expect(applySelfOp(doc, { type: "add", facet: "WHY", text: "one more" }, NOW, ids()).ok).toBe(false);
  });

  it("accepting a suggestion adds a line; answering twice fails", () => {
    const withS = addSuggestions(base, [{ facet: "NONNEG", text: "Production stays local.", why: "You turned down offshore twice." }], NOW, ids());
    const s = withS.suggestions[0]!;
    const yes = applySelfOp(withS, { type: "accept", id: s.id }, NOW, ids());
    expect(yes.ok && yes.doc.lines.at(-1)).toMatchObject({ facet: "NONNEG", source: "suggestion" });
    if (!yes.ok) throw new Error();
    expect(applySelfOp(yes.doc, { type: "reject", id: s.id }, NOW, ids()).ok).toBe(false);
  });
});

describe("addSuggestions", () => {
  it("skips repeats of lines and of answered suggestions, and caps pending at three", () => {
    let doc = selfFromOnboarding({ beliefs: "Logistics is the real cost" }, NOW, ids());
    doc = addSuggestions(doc, [{ facet: "BELIEVE", text: "logistics is the REAL cost!", why: "" }], NOW, ids());
    expect(doc.suggestions).toHaveLength(0);
    doc = addSuggestions(
      doc,
      ["a", "b", "c", "d"].map((t) => ({ facet: "WHY" as const, text: t, why: "" })),
      NOW,
      ids(),
    );
    expect(doc.suggestions.filter((s) => s.status === "PENDING")).toHaveLength(3);
  });
});

describe("parseSelfDoc", () => {
  it("returns null for nothing or junk", () => {
    expect(parseSelfDoc(null)).toBeNull();
    expect(parseSelfDoc({ lines: [{ nope: 1 }] })).toBeNull();
    expect(parseSelfDoc({})).toEqual({ lines: [], suggestions: [] });
  });
});
