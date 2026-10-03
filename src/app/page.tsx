import Link from "next/link";
import type { Route } from "next";
import { FIRST_SCREEN, INSPIRATIONS, jitter, scatter, type Inspiration } from "@/lib/inspirations";
import { ThemeCorner } from "@/components/site/ThemeCorner";
import { cn } from "@/lib/cn";

/**
 * The Self front door: "Self", "What moves us.", and numbered inspirations
 * (paintings and complete poems) scattered around the words, continuing as
 * a field when you scroll. Poems are set in italics, paintings upright.
 */

const SPOTS = scatter(FIRST_SCREEN.desktop);

function Num({ w, className, style }: { w: Inspiration; className?: string; style?: React.CSSProperties }) {
  const label = w.kind === "blank" ? w.title : `${w.title}, ${w.author}`;
  return (
    <Link
      href={`/inspiration/${w.n}` as Route}
      title={label}
      aria-label={`Inspiration ${w.n}: ${label}`}
      className={cn(
        "font-display leading-none text-fg-subtle transition-colors duration-(--duration-base) hover:text-fg focus-visible:text-fg",
        w.kind !== "art" && "italic",
        className,
      )}
      style={style}
    >
      {w.n}
    </Link>
  );
}

function Cell({ w, className }: { w: Inspiration; className?: string }) {
  const j = jitter(w.n);
  return (
    <div className={cn("flex h-12 items-center justify-center", className)}>
      <Num w={w} className="p-2 text-lg md:text-xl" style={{ transform: `translate(${j.x}rem, ${j.y}rem) scale(${j.scale})` }} />
    </div>
  );
}

export default function Home() {
  const first = INSPIRATIONS.slice(0, FIRST_SCREEN.desktop);
  const phoneOnly = INSPIRATIONS.slice(FIRST_SCREEN.phone, FIRST_SCREEN.desktop);
  const rest = INSPIRATIONS.slice(FIRST_SCREEN.desktop);

  return (
    <main className="overflow-x-hidden bg-surface">
      <ThemeCorner />
      <section aria-label="Self" className="relative h-dvh min-h-[34rem]">
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-title">
            {/* Opens the SELF calibration, served here at /self (see src/proxy.ts). */}
            <a
              href="/self"
              className="pointer-events-auto transition-opacity duration-(--duration-base) hover:opacity-70 focus-visible:opacity-70"
            >
              Self
            </a>
          </h1>
          <p className="text-3xl text-fg-muted">What moves us.</p>
        </div>
        {first.map((w, i) => (
          <Num
            key={w.n}
            w={w}
            className={cn("absolute -translate-x-1/2 -translate-y-1/2 p-2 text-2xl md:text-3xl", i >= FIRST_SCREEN.phone && "hidden md:block")}
            style={{ left: `${SPOTS[i].left}%`, top: `${SPOTS[i].top}%` }}
          />
        ))}
      </section>

      <nav
        aria-label="More inspiration"
        className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-y-6 px-6 pt-10 pb-24 md:grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] md:gap-y-6 md:px-10"
      >
        {phoneOnly.map((w) => (
          <Cell key={w.n} w={w} className="md:hidden" />
        ))}
        {rest.map((w) => (
          <Cell key={w.n} w={w} />
        ))}
      </nav>
    </main>
  );
}
