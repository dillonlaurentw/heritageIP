import Link from "next/link";
import type { Route } from "next";
import { INSPIRATIONS, SPOTS } from "@/lib/inspirations";

/**
 * The Self front door: "Self", "What moves us.", and numbered inspirations
 * scattered around the page, each opening one creative work. Nothing else.
 */
export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-6 py-16 text-center">
      <h1 className="text-title">Self</h1>
      <p className="text-3xl text-fg-muted">What moves us.</p>

      <nav aria-label="Inspiration" className="mt-12 flex max-w-xs flex-wrap justify-center gap-x-7 gap-y-4 md:mt-0 md:block md:max-w-none">
        {INSPIRATIONS.map((i) => (
          <Link
            key={i.n}
            href={`/inspiration/${i.n}` as Route}
            aria-label={`Inspiration ${i.n}: ${i.title}`}
            title={i.title}
            className="group font-display text-2xl text-fg-subtle transition-colors duration-(--duration-base) hover:text-fg md:absolute md:-translate-x-1/2 md:-translate-y-1/2 md:text-3xl"
            style={{ left: `${SPOTS[i.n].left}%`, top: `${SPOTS[i.n].top}%` }}
          >
            {i.n}
            <span className="pointer-events-none absolute top-full left-1/2 hidden -translate-x-1/2 pt-1 font-sans text-xs whitespace-nowrap text-fg-muted opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100 md:block">
              {i.title}
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
