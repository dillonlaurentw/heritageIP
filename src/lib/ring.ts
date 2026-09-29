/**
 * The ring: you in the middle, four kinds of people around you. Pure layout
 * and grouping rules (no DB, no React), unit tested in __tests__/ring.test.ts.
 *
 * Angles are in degrees, SVG style: 0° is 3 o'clock and angles grow clockwise.
 */

export const THEMES = ["COFOUNDERS", "PARTNERS", "ADVISORS", "CAPITAL"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COPY: Record<Theme, { label: string; one: string; empty: string }> = {
  COFOUNDERS: { label: "Co-founders", one: "co-founder or teammate", empty: "Waiting for your idea" },
  PARTNERS: { label: "Partners", one: "partner", empty: "Arrive with your plan" },
  ADVISORS: { label: "Advisors", one: "advisor", empty: "Mentors and specialists" },
  CAPITAL: { label: "Capital", one: "backer", empty: "Later, not first" },
};

/** Each theme owns a quarter. Co-founders top-left, then clockwise. */
export const THEME_ARC: Record<Theme, [start: number, end: number]> = {
  COFOUNDERS: [180, 270],
  PARTNERS: [270, 360],
  ADVISORS: [0, 90],
  CAPITAL: [90, 180],
};

/** Gap left at each end of an arc, so the four quarters read as four. */
export const ARC_GAP = 7;

export type RingNodeKind = "person" | "firm" | "open";
/** linked: working together · pending: asked, not answered yet · open: an empty chair the plan needs. */
export type RingNodeState = "linked" | "pending" | "open";

export type RingNode = {
  id: string;
  theme: Theme;
  kind: RingNodeKind;
  state: RingNodeState;
  /** Full name for labels and screen readers ("Dev Raman", "Harbor & Vine"). */
  name: string;
  /** One line: "co-founder", "intro pending", "needs a lab partner". */
  note: string;
  href?: string;
};

export type PlacedNode = RingNode & { angle: number; x: number; y: number };

/** Most nodes one arc shows before it folds the rest into "+N". */
export const MAX_PER_ARC = 5;

/** Evenly spaced angles for `n` nodes inside a quarter, clear of its gaps. */
export function arcAngles(theme: Theme, n: number): number[] {
  if (n <= 0) return [];
  const [a, b] = THEME_ARC[theme];
  const lo = a + ARC_GAP + 6;
  const hi = b - ARC_GAP - 6;
  if (n === 1) return [(lo + hi) / 2];
  const step = (hi - lo) / (n - 1);
  return Array.from({ length: n }, (_, i) => lo + i * step);
}

export function point(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** An SVG arc path from `a` to `b` degrees (clockwise). */
export function arcPath(cx: number, cy: number, r: number, a: number, b: number) {
  const s = point(cx, cy, r, a);
  const e = point(cx, cy, r, b);
  const large = b - a > 180 ? 1 : 0;
  const f = (v: number) => Math.round(v * 10) / 10;
  return `M ${f(s.x)} ${f(s.y)} A ${r} ${r} 0 ${large} 1 ${f(e.x)} ${f(e.y)}`;
}

/** Order inside an arc: people you work with first, then pending, then open chairs. */
const STATE_ORDER: Record<RingNodeState, number> = { linked: 0, pending: 1, open: 2 };

export function groupByTheme(nodes: RingNode[]): Record<Theme, RingNode[]> {
  const out = { COFOUNDERS: [], PARTNERS: [], ADVISORS: [], CAPITAL: [] } as Record<Theme, RingNode[]>;
  for (const n of nodes) out[n.theme].push(n);
  for (const t of THEMES) out[t].sort((x, y) => STATE_ORDER[x.state] - STATE_ORDER[y.state]);
  return out;
}

/**
 * Places nodes on a ring of radius `r` around (cx, cy). Each arc shows at
 * most MAX_PER_ARC; the rest are counted in `overflow`, never dropped silently.
 */
export function layoutRing(nodes: RingNode[], cx: number, cy: number, r: number) {
  const grouped = groupByTheme(nodes);
  const placed: PlacedNode[] = [];
  const overflow = {} as Record<Theme, number>;
  for (const t of THEMES) {
    const shown = grouped[t].slice(0, MAX_PER_ARC);
    overflow[t] = grouped[t].length - shown.length;
    arcAngles(t, shown.length).forEach((angle, i) => {
      placed.push({ ...shown[i]!, angle, ...point(cx, cy, r, angle) });
    });
  }
  return { placed, overflow };
}

/** "2 people · 1 open chair": the short line under each quarter's label. */
export function themeSummary(theme: Theme, nodes: RingNode[]): string {
  const mine = nodes.filter((n) => n.theme === theme);
  if (mine.length === 0) return THEME_COPY[theme].empty;
  const linked = mine.filter((n) => n.state === "linked").length;
  const pending = mine.filter((n) => n.state === "pending").length;
  const open = mine.filter((n) => n.state === "open").length;
  const parts: string[] = [];
  if (linked) parts.push(`${linked} with you`);
  if (pending) parts.push(`${pending} pending`);
  if (open) parts.push(`${open} open ${open === 1 ? "chair" : "chairs"}`);
  return parts.join(" · ");
}

/** Initials for a node: "Dev Raman" → "DR", "Harbor & Vine" → "HV". */
export function initials(name: string): string {
  return (
    name
      .split(/[\s&+-]+/)
      .filter((w) => /^[\p{L}\p{N}]/u.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}
