import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * The three inspirations linked from the home page. The poems are Shel
 * Silverstein's (Falling Up, 1996) and under copyright: only the title, the
 * opening line and the credit are shown. Add the full text only with
 * permission from the estate.
 */
const POEMS: Record<string, { title: string; opening: string }> = {
  "1": { title: "The Voice", opening: "There is a voice inside of you" },
  "2": { title: "Underface", opening: "Underneath my outside face" },
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
      <p className="font-display text-2xl">{poem.opening} …</p>
      <p className="text-sm text-fg-subtle">Shel Silverstein, from Falling Up (1996)</p>
      <Link href="/" className="mt-10 font-display text-xl text-fg-muted hover:text-fg">
        Self
      </Link>
    </main>
  );
}
