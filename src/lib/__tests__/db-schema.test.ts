import { describe, expect, it } from "vitest";
import { applyView, DEFAULT_STATUS, groupRows, isDone, normalizeValue, progress, readConfig, valueForGroup, type DbSchema, type Property, type RowLike } from "../db-schema";

const status: Property = { id: "st", name: "Status", type: "status", options: DEFAULT_STATUS };
const owner: Property = { id: "ow", name: "Owner", type: "person" };
const due: Property = { id: "du", name: "Due", type: "date" };
const pts: Property = { id: "pt", name: "Points", type: "number" };
const tags: Property = { id: "tg", name: "Tags", type: "multiSelect", options: [{ id: "a", name: "Legal", color: "red" }, { id: "b", name: "Supplier", color: "orange" }] };
const schema: DbSchema = { properties: [status, owner, due, pts, tags] };

const row = (id: string, title: string, props: RowLike["props"]): RowLike => ({ id, title, props, createdAt: `2026-01-0${id}`, updatedAt: "2026-01-01" });
const rows = [
  row("1", "Book press", { st: "doing", ow: ["maya"], du: "2026-10-02", pt: 3, tg: ["b"] }),
  row("2", "Lab test", { st: "todo", ow: ["dev"], du: "2026-09-30", pt: 5, tg: ["a"] }),
  row("3", "Name buyer", { st: "done", ow: ["maya", "dev"], du: null, pt: null, tg: [] }),
];

describe("normalizeValue", () => {
  it("keeps valid values and drops junk", () => {
    expect(normalizeValue(status, "done")).toBe("done");
    expect(normalizeValue(status, "nope")).toBeNull();
    expect(normalizeValue(pts, "4.5")).toBe(4.5);
    expect(normalizeValue(pts, "abc")).toBeNull();
    expect(normalizeValue(due, "2026-01-05")).toBe("2026-01-05");
    expect(normalizeValue(due, "Jan 5")).toBeNull();
    expect(normalizeValue(tags, ["a", "zzz", "a"])).toEqual(["a"]);
    expect(normalizeValue({ id: "c", name: "C", type: "checkbox" }, "true")).toBe(true);
  });
});

describe("applyView", () => {
  it("filters by person = me, status done, and dates", () => {
    const me = (f: Parameters<typeof applyView>[2]["filters"]) => applyView(rows, schema, { filters: f, sorts: [] }, "maya").map((r) => r.id);
    expect(me([{ propId: "ow", op: "me" }])).toEqual(["1", "3"]);
    expect(me([{ propId: "st", op: "not_done" }])).toEqual(["1", "2"]);
    expect(me([{ propId: "du", op: "before", value: "2026-10-01" }])).toEqual(["2"]);
    expect(me([{ propId: "tg", op: "is", value: "a" }])).toEqual(["2"]);
    expect(me([{ propId: "title", op: "contains", value: "LAB" }])).toEqual(["2"]);
  });

  it("sorts with empty values last, and status by option order", () => {
    const sorted = (s: Parameters<typeof applyView>[2]["sorts"]) => applyView(rows, schema, { filters: [], sorts: s }, "maya").map((r) => r.id);
    expect(sorted([{ propId: "pt", dir: "desc" }])).toEqual(["2", "1", "3"]);
    expect(sorted([{ propId: "du", dir: "asc" }])).toEqual(["2", "1", "3"]);
    expect(sorted([{ propId: "st", dir: "asc" }])).toEqual(["2", "1", "3"]);
  });

  it("searches titles and property text", () => {
    expect(applyView(rows, schema, { filters: [], sorts: [] }, "maya", {}, "supplier").map((r) => r.id)).toEqual(["1"]);
  });
});

describe("groupRows", () => {
  it("makes one column per option in order, and puts multi-values in each", () => {
    const g = groupRows(rows, status);
    expect(g.map((x) => x.label)).toEqual(["Not started", "In progress", "Done"]);
    const people = groupRows(rows, owner, { maya: "Maya", dev: "Dev" });
    expect(people.find((x) => x.key === "maya")?.rows.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("moves a card between columns", () => {
    expect(valueForGroup(status, "todo", "todo", "done")).toBe("done");
    expect(valueForGroup(owner, ["maya", "dev"], "dev", "ana")).toEqual(["maya", "ana"]);
    expect(valueForGroup(status, "todo", "todo", "")).toBeNull();
  });
});

describe("progress and done", () => {
  it("counts done rows", () => {
    expect(isDone(status, "done")).toBe(true);
    expect(progress(rows, status)).toBeCloseTo(1 / 3);
    expect(progress([], status)).toBeNull();
  });
  it("reads bad config as empty", () => {
    expect(readConfig({ nope: 1 })).toEqual({ filters: [], sorts: [], hidden: [] });
  });
});

describe("readSchema", () => {
  it("keeps valid properties even when one is broken, and allows unlinked relations", async () => {
    const { readSchema } = await import("../db-schema");
    const s = readSchema({
      properties: [
        { id: "a", name: "Status", type: "status", options: [{ id: "x", name: "X", color: "gray" }] },
        { id: "b", name: "Goal", type: "relation", relation: { databaseId: "" } },
        { id: "c", name: "", type: "text" },
      ],
    });
    expect(s.properties.map((p) => p.id)).toEqual(["a", "b"]);
  });
});
