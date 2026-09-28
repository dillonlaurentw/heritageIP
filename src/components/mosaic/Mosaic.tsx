import type { ReactNode } from "react";

/**
 * Edge-to-edge mosaic. A 12-column grid with fixed-height rows so tiles of
 * different spans lock together; `grid-flow-dense` back-fills gaps.
 * Tiles decide their own size (see Tile `span`).
 */
export function Mosaic({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid grid-flow-dense grid-cols-12 gap-gutter auto-rows-[clamp(8.5rem,13vw,14rem)] ${className}`}
    >
      {children}
    </div>
  );
}
