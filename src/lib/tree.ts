/** Build the sidebar tree from flat page rows. Pure, so it's unit tested. */
export type FlatPage = {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  kind: "PAGE" | "DATABASE" | "ROW";
  position: number;
};

export type TreeOut = {
  id: string;
  title: string;
  icon: string | null;
  href: string;
  kind: "PAGE" | "DATABASE";
  children: TreeOut[];
};

export function buildTree(rows: FlatPage[], href: (id: string) => string): TreeOut[] {
  const visible = rows.filter((r) => r.kind !== "ROW");
  const ids = new Set(visible.map((r) => r.id));
  const byParent = new Map<string | null, FlatPage[]>();
  for (const r of visible) {
    // Orphans (parent archived or a database row) surface at the top level.
    const key = r.parentId && ids.has(r.parentId) ? r.parentId : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(r);
  }
  const make = (parent: string | null, seen: Set<string>): TreeOut[] =>
    (byParent.get(parent) ?? [])
      .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
      .filter((r) => !seen.has(r.id))
      .map((r) => {
        const next = new Set(seen).add(r.id);
        return {
          id: r.id,
          title: r.title,
          icon: r.icon,
          href: href(r.id),
          kind: r.kind === "DATABASE" ? "DATABASE" : "PAGE",
          children: r.kind === "DATABASE" ? [] : make(r.id, next),
        };
      });
  return make(null, new Set());
}

/** A position between two neighbours (fractional ordering: no renumbering). */
export function positionBetween(before: number | null, after: number | null) {
  if (before == null && after == null) return 1024;
  if (before == null) return after! - 1024;
  if (after == null) return before + 1024;
  return (before + after) / 2;
}
