import Link from "next/link";
import { notFound } from "next/navigation";
import { INSPIRATIONS, inspiration } from "@/lib/inspirations";

/** One inspiration on a white page. The works themselves live in src/lib/inspirations.ts. */

export function generateStaticParams() {
  return INSPIRATIONS.map((i) => ({ n: String(i.n) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  return { title: inspiration(Number((await params).n))?.title ?? "Inspiration" };
}

export default async function Inspiration({ params }: { params: Promise<{ n: string }> }) {
  const work = inspiration(Number((await params).n));
  if (!work) notFound();

  if (work.kind === "blank")
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface px-6">
        <p className="text-3xl">{work.title}</p>
      </main>
    );

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-surface px-6 py-20 text-center">
      <h1 className="text-sm tracking-[0.2em] uppercase">{work.title}</h1>
      {work.lines?.length ? (
        <div className={`flex max-w-2xl flex-col font-display text-2xl leading-snug ${work.kind === "prose" ? "gap-5" : ""}`}>
          {work.lines.map((line, i) => (line ? <span key={i}>{line}</span> : <span key={i} aria-hidden className="h-5" />))}
        </div>
      ) : (
        <p className="font-display text-2xl">{work.opening} …</p>
      )}
      <p className="text-sm text-fg-subtle">{work.credit}</p>
      <Link href="/" className="mt-10 font-display text-xl text-fg-muted hover:text-fg">
        Self
      </Link>
    </main>
  );
}
