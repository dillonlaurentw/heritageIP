import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ARC_GAP,
  arcPath,
  initials,
  layoutRing,
  THEME_ARC,
  THEME_COPY,
  themeSummary,
  THEMES,
  type PlacedNode,
  type RingNode,
  type Theme,
} from "@/lib/ring";

/** Where each quarter's label sits, relative to the ring box. */
const LABEL_POS: Record<Theme, string> = {
  COFOUNDERS: "left-0 top-0 items-start text-left",
  PARTNERS: "right-0 top-0 items-end text-right",
  ADVISORS: "right-0 bottom-0 items-end text-right",
  CAPITAL: "left-0 bottom-0 items-start text-left",
};

/**
 * You in the middle, four kinds of people around you. Server-renderable: nodes
 * are links, so the ring works without JavaScript. Sizes scale with `size`.
 */
export function Ring({
  nodes,
  size = 520,
  center,
  labels = true,
  themeHref,
  className,
}: {
  nodes: RingNode[];
  size?: number;
  /** What sits in the middle (defaults to "you"). */
  center?: ReactNode;
  labels?: boolean;
  /** Where a quarter's label links, e.g. the matching part of the network. */
  themeHref?: Partial<Record<Theme, string>>;
  className?: string;
}) {
  const pad = labels ? 64 : 12;
  const box = size + pad * 2;
  const c = box / 2;
  const r = size * 0.4;
  const node = Math.round(Math.max(28, Math.min(44, size * 0.085)));
  const { placed, overflow } = layoutRing(nodes, c, c, r);
  const stroke = Math.max(4, Math.round(size / 70));

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: box, height: box, maxWidth: "100%" }}>
      <div className="absolute rounded-full bg-surface shadow-lift" style={{ inset: pad }} />
      <svg viewBox={`0 0 ${box} ${box}`} width="100%" height="100%" aria-hidden className="absolute inset-0">
        <g fill="none" strokeLinecap="round" strokeWidth={stroke} className="stroke-ring-track">
          {THEMES.map((t) => {
            const [a, b] = THEME_ARC[t];
            return <path key={t} d={arcPath(c, c, r, a + ARC_GAP, b - ARC_GAP)} />;
          })}
        </g>
        {/* A dark stretch of arc under everyone you work with. */}
        <g fill="none" strokeLinecap="round" strokeWidth={stroke} className="stroke-ring-link">
          {placed
            .filter((p) => p.state === "linked")
            .map((p) => (
              <path key={p.id} d={arcPath(c, c, r, p.angle - 13, p.angle + 13)} />
            ))}
        </g>
        <circle cx={c} cy={c} r={r * 0.62} className="fill-bg" />
        {!center && <circle cx={c} cy={c} r={Math.max(4, size / 90)} className="fill-accent" />}
      </svg>

      {center ?? (
        <span
          className="absolute -translate-x-1/2 text-sm text-fg-muted"
          style={{ left: c, top: c + Math.max(10, size / 36) }}
        >
          you
        </span>
      )}
      {center && (
        <div className="absolute flex items-center justify-center text-center" style={{ left: c - r * 0.55, top: c - r * 0.55, width: r * 1.1, height: r * 1.1 }}>
          {center}
        </div>
      )}

      {placed.map((p) => (
        <RingDot key={p.id} p={p} size={node} />
      ))}

      {labels &&
        THEMES.map((t) => {
          const more = overflow[t];
          const inner = (
            <>
              <span className="text-base font-medium text-fg">{THEME_COPY[t].label}</span>
              <span className="text-sm text-fg-muted">
                {themeSummary(t, nodes)}
                {more > 0 && ` · +${more} more`}
              </span>
            </>
          );
          const cls = cn("absolute flex max-w-[45%] flex-col gap-0.5", LABEL_POS[t]);
          const href = themeHref?.[t];
          return href ? (
            <Link key={t} href={href as Route} className={cn(cls, "rounded-md hover:[&>span:first-child]:text-accent-text")}>
              {inner}
            </Link>
          ) : (
            <div key={t} className={cls}>
              {inner}
            </div>
          );
        })}
    </div>
  );
}

function RingDot({ p, size }: { p: PlacedNode; size: number }) {
  const style = { left: p.x - size / 2, top: p.y - size / 2, width: size, height: size };
  const label = `${p.name}, ${p.note}`;
  const cls = cn(
    "absolute flex items-center justify-center text-xs font-medium transition-transform duration-(--duration-fast) ease-out hover:scale-110",
    p.kind === "firm" ? "rounded-[30%]" : "rounded-full",
    p.state === "open" && "border-[1.5px] border-dashed border-accent bg-surface text-lg font-light text-accent",
    p.state === "linked" && p.kind === "person" && "bg-primary text-primary-fg",
    p.state === "linked" && p.kind === "firm" && "bg-surface text-fg shadow-[inset_0_0_0_1.5px_var(--ring-link)]",
    p.state === "pending" && "bg-surface text-fg-subtle shadow-[inset_0_0_0_1px_var(--border-strong)]",
  );
  const body = p.state === "open" ? "+" : initials(p.name);
  return p.href ? (
    <Link href={p.href as Route} aria-label={label} title={label} className={cls} style={style}>
      {body}
    </Link>
  ) : (
    <span role="img" aria-label={label} title={label} className={cls} style={style}>
      {body}
    </span>
  );
}
