import { describe, expect, it } from "vitest";
import { buildTree, positionBetween, type FlatPage } from "../tree";

const p = (id: string, parentId: string | null, position: number, kind: FlatPage["kind"] = "PAGE"): FlatPage => ({
  id,
  parentId,
  title: id,
  icon: null,
  kind,
  position,
});

describe("buildTree", () => {
  it("nests pages and sorts siblings by position", () => {
    const t = buildTree([p("b", null, 2), p("a", null, 1), p("a1", "a", 1)], (id) => `/x/${id}`);
    expect(t.map((n) => n.id)).toEqual(["a", "b"]);
    expect(t[0].children[0]).toMatchObject({ id: "a1", href: "/x/a1" });
  });

  it("hides database rows and doesn't nest inside databases", () => {
    const t = buildTree([p("db", null, 1, "DATABASE"), p("row", "db", 1, "ROW")], (id) => id);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ kind: "DATABASE", children: [] });
  });

  it("lifts orphans whose parent is gone to the top", () => {
    const t = buildTree([p("child", "missing", 1)], (id) => id);
    expect(t.map((n) => n.id)).toEqual(["child"]);
  });
});

describe("positionBetween", () => {
  it("fits between, before, after, or alone", () => {
    expect(positionBetween(1, 3)).toBe(2);
    expect(positionBetween(null, 1024)).toBe(0);
    expect(positionBetween(1024, null)).toBe(2048);
    expect(positionBetween(null, null)).toBe(1024);
  });
});
