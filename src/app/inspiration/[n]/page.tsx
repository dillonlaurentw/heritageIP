import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArtImage } from "@/components/site/ArtImage";
import { ThemeCorner } from "@/components/site/ThemeCorner";
import { INSPIRATIONS, inspiration, neighbours } from "@/lib/inspirations";

/** One inspiration on a white page (dark in dark mode): a painting or a complete poem. */

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
    <main className="flex min-h-dvh flex-col bg-surface px-5 md:px-10">
      <ThemeCorner />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center md:gap-6 md:py-8">
        {work.kind === "blank" ? (
          <p className="text-3xl">{work.title}</p>
        ) : work.kind === "art" ? (
          <>
            <ArtImage src={work.image} alt={work.alt || `${work.title} by ${work.author}`} href={work.url} museum={work.credit} />
            <div className="flex max-w-xl flex-col gap-1.5">
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
            <h1 className="text-sm tracking-[0.2em] uppercase">{work.title}</h1>
            {work.lines?.length ? (
              <div className={`flex max-w-2xl flex-col font-display text-xl leading-snug md:text-2xl ${work.kind === "prose" ? "gap-5" : ""}`}>
                {work.lines.map((line, i) => (line ? <span key={i}>{line}</span> : <span key={i} aria-hidden className="h-5" />))}
              </div>
            ) : (
              <p className="font-display text-xl md:text-2xl">{work.opening} …</p>
            )}
            <p className="text-sm text-fg-subtle">{work.credit}</p>
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
