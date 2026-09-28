import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Label } from "@/components/ui/Label";

export type TileSpan = "hero" | "wide" | "half" | "tall" | "square" | "quarter" | "strip";

/* Mobile first: most tiles go full width or half width on phones. */
const spanClass: Record<TileSpan, string> = {
  hero: "col-span-12 row-span-3 md:col-span-8 md:row-span-4",
  wide: "col-span-12 row-span-2 md:col-span-8",
  half: "col-span-12 row-span-2 md:col-span-6 md:row-span-3",
  tall: "col-span-12 row-span-3 sm:col-span-6 md:col-span-4 md:row-span-4",
  square: "col-span-6 row-span-2 md:col-span-4",
  quarter: "col-span-6 row-span-2 md:col-span-3",
  strip: "col-span-12 row-span-1",
};

export type TileTone = "raised" | "bone" | "signal" | "field";

const toneClass: Record<TileTone, { bg: string; text: string; label: "smoke" | "field" }> = {
  raised: { bg: "bg-field-raised", text: "text-bone", label: "smoke" },
  field: { bg: "bg-field border border-line", text: "text-bone", label: "smoke" },
  bone: { bg: "bg-bone", text: "text-field", label: "field" },
  signal: { bg: "bg-signal", text: "text-field", label: "field" },
};

/**
 * One tile in the mosaic: full-bleed media or type, a mono label, a title.
 * Hover: media scales slightly and the title widens (variable width axis).
 */
export function Tile<T extends string>({
  span = "square",
  tone = "raised",
  index = 0,
  label,
  meta,
  title,
  media,
  href,
  children,
  subtitle,
  className = "",
}: {
  span?: TileSpan;
  tone?: TileTone;
  /** Position in the mosaic, for the stagger. */
  index?: number;
  label?: string;
  /** Top-right slot, e.g. <Tag>NEW</Tag> or a "STEP 2/9" label. */
  meta?: ReactNode;
  title?: string;
  /** Full-bleed artwork: <CoverArt/>, an <img>, or big type. */
  media?: ReactNode;
  href?: Route<T>;
  /** Type tiles only: free content between the label and the title. */
  children?: ReactNode;
  /** Type tiles only: a line under the title. */
  subtitle?: string | null;
  className?: string;
}) {
  const t = toneClass[tone];
  const titleClass =
    "type-display transition-[--wdth] duration-(--duration-base) ease-out-strong group-hover:[--wdth:118]";

  // Media tiles: artwork fills the tile, caption sits beneath it like a
  // portfolio plate. Type tiles: label top, title bottom, on the tile ground.
  const body = media ? (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-(--duration-slow) ease-out-strong motion-safe:group-hover:scale-[1.04]">
          {media}
        </div>
        {meta && <div className="absolute top-3 right-3">{meta}</div>}
      </div>
      <div className="flex items-end justify-between gap-4 px-3 pt-2.5 pb-3 md:px-4">
        {title && <h3 className={`${titleClass} truncate text-lead`}>{title}</h3>}
        {label && (
          <Label tone={t.label} className="shrink-0">
            {label}
          </Label>
        )}
      </div>
    </div>
  ) : (
    <div className="relative flex h-full flex-col justify-between p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        {label ? <Label tone={t.label}>{label}</Label> : <span />}
        {meta}
      </div>
      {children}
      {title && (
        <div>
          <h3 className={`${titleClass} max-w-[16ch] text-title`}>{title}</h3>
          {subtitle && <p className="measure mt-2 text-body opacity-80">{subtitle}</p>}
        </div>
      )}
    </div>
  );

  const shell = `group relative block size-full overflow-hidden rounded-xs ${t.bg} ${t.text}`;

  return (
    <Reveal index={index} className={`${spanClass[span]} ${className}`}>
      {href ? (
        <Link href={href} transitionTypes={["nav-forward"]} className={shell}>
          {body}
        </Link>
      ) : (
        <div className={shell}>{body}</div>
      )}
    </Reveal>
  );
}
