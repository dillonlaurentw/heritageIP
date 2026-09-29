import { describe, expect, it } from "vitest";
import { actionItems, goalProgress, itemsToSend, startOfWeek, summarizeWeek } from "../ops-rules";

const todo = (content: unknown[], checked = false, children: unknown[] = []) => ({ id: Math.random().toString(36), type: "checkListItem", props: { checked }, content, children });
const text = (t: string) => ({ type: "text", text: t, styles: {} });
const mention = (userId: string, name: string) => ({ type: "mention", props: { userId, name } });

describe("actionItems", () => {
  it("finds unchecked to-dos with their mentions, including nested ones", () => {
    const doc = [
      { type: "paragraph", content: [text("Notes")], children: [] },
      todo([text("Send the sample dates "), mention("u1", "Dev")]),
      todo([text("Already done")], true),
      { type: "bulletListItem", content: [text("x")], children: [todo([text("Nested one")])] },
    ];
    const items = actionItems(doc);
    expect(items.map((i) => i.text)).toEqual(["Send the sample dates", "Nested one"]);
    expect(items[0].mentions).toEqual(["u1"]);
  });
});

describe("itemsToSend", () => {
  const items = [
    { id: "a", text: "Send dates", mentions: ["u1", "stranger"] },
    { id: "b", text: "send  dates", mentions: [] },
    { id: "c", text: "Book the lab", mentions: [] },
  ];
  it("skips items already sent and duplicates, keeps only member assignees", () => {
    expect(itemsToSend(items, [], ["u1"])).toEqual([
      { title: "Send dates", assignee: ["u1"] },
      { title: "Book the lab", assignee: [] },
    ]);
    expect(itemsToSend(items, ["Book the lab"], ["u1"]).map((i) => i.title)).toEqual(["Send dates"]);
  });
});

describe("goalProgress", () => {
  it("counts done and total tasks per linked goal", () => {
    const p = goalProgress([
      { status: "done", goal: ["g1"] },
      { status: "todo", goal: ["g1", "g2"] },
      { status: "done", goal: null },
    ]);
    expect(p).toEqual({ g1: { done: 1, total: 2 }, g2: { done: 0, total: 1 } });
  });
});

describe("summarizeWeek", () => {
  it("groups activity and de-duplicates repeats", () => {
    const at = new Date();
    const s = summarizeWeek([
      { kind: "row.done", title: "Book press", actor: "Maya", at },
      { kind: "row.done", title: "Book press", actor: "Maya", at },
      { kind: "page.created", title: "Brand voice", actor: "Dev", at },
      { kind: "member.joined", title: "", actor: "Rosa", at },
    ]);
    expect(s.finished.map((a) => a.title)).toEqual(["Book press"]);
    expect(s.created).toHaveLength(1);
    expect(s.joined).toHaveLength(1);
    expect(s.mostActive[0]).toBe("Maya");
  });
});

describe("startOfWeek", () => {
  it("returns the Monday of the week", () => {
    const d = startOfWeek(new Date(2026, 8, 30, 15)); // Wed 30 Sep 2026
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
});
