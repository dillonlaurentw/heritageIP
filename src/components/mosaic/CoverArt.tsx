/**
 * Generated, type-only cover art for a Project Hub. Deterministic: the same
 * hub name always produces the same cover. No images, no gradients: just
 * heavy type, cropped with intent. Sizes use container units so the art
 * scales with whatever tile it sits in.
 */

export type CoverLayout = "initial" | "stack" | "repeat" | "index";
export type CoverTone = "raised" | "bone" | "signal";

export type CoverSpec = { layout: CoverLayout; tone: CoverTone };

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const COVER_LAYOUTS: CoverLayout[] = ["initial", "stack", "repeat", "index"];
export const COVER_TONES: CoverTone[] = ["raised", "bone", "signal"];
const layouts = COVER_LAYOUTS;
// Signal appears roughly 1 in 7 so it stays rare in any list.
const tones: CoverTone[] = ["raised", "raised", "raised", "bone", "bone", "raised", "signal"];

export function coverFor(seed: string): CoverSpec {
  const h = hash(seed);
  return { layout: layouts[h % layouts.length], tone: tones[(h >>> 3) % tones.length] };
}

const toneClass: Record<CoverTone, string> = {
  raised: "bg-field-raised text-bone",
  bone: "bg-bone text-field",
  signal: "bg-signal text-field",
};

export function CoverArt({
  name,
  number,
  spec,
}: {
  name: string;
  /** Shown by the "index" layout, e.g. 3 → "03". */
  number?: number;
  /** Override the generated layout/tone. */
  spec?: Partial<CoverSpec>;
}) {
  const { layout, tone } = { ...coverFor(name), ...spec };
  const words = name.toUpperCase().split(/\s+/).filter(Boolean);
  const longest = Math.max(...words.slice(0, 3).map((w) => w.length), 1);
  const shift = "transition-transform duration-(--duration-slow) ease-out-strong";

  return (
    <div aria-hidden className={`relative size-full [container-type:size] overflow-hidden select-none ${toneClass[tone]}`}>
      {layout === "initial" && (
        <span
          className={`type-display absolute -right-[0.05em] -bottom-[0.2em] text-[min(78cqw,135cqh)] leading-[0.8] ${shift} motion-safe:group-hover:-translate-x-[3cqw]`}
        >
          {words[0]?.[0]}
        </span>
      )}

      {layout === "stack" && (
        <div className={`absolute top-[3cqh] -left-[1.5cqw] ${shift} motion-safe:group-hover:translate-x-[2cqw]`}>
          {words.slice(0, 3).map((w, i) => (
            <span
              key={i}
              // Size to the longest word so single long names aren't clipped.
              style={{ fontSize: `min(22cqw, ${Math.floor(140 / longest)}cqw, 30cqh)` }}
              className="type-display block leading-[0.82] whitespace-nowrap"
            >
              {w}
            </span>
          ))}
        </div>
      )}

      {layout === "repeat" && (
        <div className="absolute inset-0 flex flex-col justify-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              style={{ ["--wdth" as string]: i % 2 ? 62 : 125 }}
              className={`type-display block text-[min(15cqw,19cqh)] leading-[0.86] whitespace-nowrap ${shift} ${
                i === 2 ? "opacity-100" : "opacity-25"
              } ${i % 2 ? "motion-safe:group-hover:-translate-x-[6cqw]" : "motion-safe:group-hover:translate-x-[4cqw]"}`}
            >
              {Array(4).fill(words[0]).join(" ")}
            </span>
          ))}
        </div>
      )}

      {layout === "index" && (
        <>
          <span
            className={`type-display absolute -top-[0.1em] -left-[0.03em] text-[min(56cqw,80cqh)] leading-none ${shift} motion-safe:group-hover:translate-y-[3cqw]`}
          >
            {String(number ?? (hash(name) % 90) + 10).padStart(2, "0")}
          </span>
          <span className="label absolute right-[4cqw] bottom-[4cqw] max-w-[40cqw] text-right">{name}</span>
        </>
      )}
    </div>
  );
}

/** The tile tone that matches a hub's cover, so caption and art read as one plate. */
export function coverTileTone(hub: { name: string; coverTone?: string | null; coverImageUrl?: string | null }): CoverTone {
  if (hub.coverImageUrl) return "raised";
  return (hub.coverTone as CoverTone | null) ?? coverFor(hub.name).tone;
}
