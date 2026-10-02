import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * The three inspirations linked from the home page. The poems are Shel
 * Silverstein's (Falling Up, 1996) and under copyright. Until `lines` is
 * filled in (by whoever holds the permission), the page shows the title, the
 * opening line and the credit. With `lines`, it shows the whole poem.
 * Put the exact credit wording the permission asks for in `credit`.
 */
type Poem = { title: string; opening: string; lines?: string[]; credit: string };

const POEMS: Record<string, Poem> = {
  "1": {
    title: "The Voice",
    opening: "There is a voice inside of you",
    // lines: ["first line", "second line", ...],
    credit: "Shel Silverstein, from Falling Up (1996)",
  },
  "2": {
    title: "Underface",
    opening: "Underneath my outside face",
    // lines: ["first line", "second line", ...],
    credit: "Shel Silverstein, from Falling Up (1996)",
  },
};

export function generateStaticParams() {
  return [{ n: "1" }, { n: "2" }, { n: "3" }];
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return { title: POEMS[n]?.title ?? "You. Me." };
}

export default async function Inspiration({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;

  if (n === "3")
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface px-6">
        <p className="text-3xl">You. Me.</p>
      </main>
    );

  const poem = POEMS[n];
  if (!poem) notFound();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-surface px-6 text-center">
      <h1 className="text-sm tracking-[0.2em] uppercase">{poem.title}</h1>
      {poem.lines?.length ? (
        <div className="flex flex-col font-display text-2xl leading-snug">
          {poem.lines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      ) : (
        <p className="font-display text-2xl">{poem.opening} …</p>
      )}
      <p className="text-sm text-fg-subtle">{poem.credit}</p>
      <Link href="/" className="mt-10 font-display text-xl text-fg-muted hover:text-fg">
        Self
      </Link>
    </main>
  );
}
