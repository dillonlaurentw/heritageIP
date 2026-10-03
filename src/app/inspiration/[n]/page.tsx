import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArtImage } from "@/components/site/ArtImage";
import { FitText } from "@/components/site/FitText";
import { ThemeCorner } from "@/components/site/ThemeCorner";
import { INSPIRATIONS, inspiration, neighbours } from "@/lib/inspirations";

/**
 * One inspiration on a white page (dark in dark mode): a painting or a
 * complete poem. Every work fits one screen with its ← n · Self · n → row:
 * paintings take the space the caption leaves, poems size their text to fit.
 */

/** A poem's lines grouped into stanzas ("" separates them). */
function stanzas(lines: string[]): string[][] {
  const out: string[][] = [[]];
  for (const line of lines) {
    if (line) out[out.length - 1].push(line);
    else if (out[out.length - 1].length) out.push([]);
  }
  return out.filter((s) => s.length);
}

export function generateStaticParams() {
  return INSPIRATIONS.map((i) => ({ n: String(i.n) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const w = inspiration(Number((await params).n));
  return { title: w ? (w.kind === "art" ? `${w.title}, ${w.author}` : w.title) : "Inspiration" };
}

export default async function Inspiration({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  const work = inspiration(n);
  if (!work) notFound();
  const { prev, next } = neighbours(n);

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-surface px-5 md:px-10">
      <ThemeCorner />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 pt-10 pb-4 text-center md:gap-6 md:pt-8 md:pb-6">
        {work.kind === "blank" ? (
          <p className="text-3xl">{work.title}</p>
        ) : work.kind === "art" ? (
          <>
            <div className="relative min-h-0 w-full flex-1">
              <ArtImage src={work.image} alt={work.alt || `${work.title} by ${work.author}`} href={work.url} museum={work.credit} />
            </div>
            <div className="flex max-w-xl shrink-0 flex-col gap-1.5">
              <h1 className="font-display text-2xl md:text-3xl">{work.title}</h1>
              <p className="text-fg-muted">
                {work.author}
                {work.date && `, ${work.date}`}
              </p>
              <a href={work.url} target="_blank" rel="noopener noreferrer" className="text-sm text-fg-subtle hover:text-fg">
                {work.credit}, public domain ↗
              </a>
            </div>
          </>
        ) : (
          <>
            <h1 className="shrink-0 text-sm tracking-[0.2em] uppercase">{work.title}</h1>
            <FitText
              max={{ phone: 20, wide: 24 }}
              columns={(work.lines?.length ?? 0) > 20}
              estimate={`min(24px, calc((100dvh - 14rem) / ${Math.max(work.lines?.length ?? 1, 1) * 1.4}))`}
              className={`max-w-4xl gap-x-[3em] font-display ${(work.lines?.length ?? 0) > 20 ? "leading-tight md:leading-snug" : "leading-snug"}`}
            >
              {work.lines?.length ? (
                (work.kind === "prose" ? work.lines.filter(Boolean).map((l) => [l]) : stanzas(work.lines)).map((stanza, i) => (
                  // A stanza never splits across the two columns.
                  <div key={i} className="mb-[0.8em] break-inside-avoid last:mb-0">
                    {stanza.map((line, j) => (
                      <span key={j} className="block">
                        {line}
                      </span>
                    ))}
                  </div>
                ))
              ) : (
                <p>{work.opening} …</p>
              )}
            </FitText>
            <p className="shrink-0 text-sm text-fg-subtle">{work.credit}</p>
          </>
        )}
      </div>

      <nav aria-label="Wander" className="flex items-center justify-between pb-4 font-display text-xl text-fg-muted md:pb-6">
        {prev ? (
          <Link href={`/inspiration/${prev}` as Route} className="p-2 hover:text-fg">
            ← {prev}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/" className="p-2 hover:text-fg">
          Self
        </Link>
        {next ? (
          <Link href={`/inspiration/${next}` as Route} className="p-2 hover:text-fg">
            {next} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
