import Link from "next/link";
import type { Route } from "next";

/** The Self front door: the name, what moves us, and three inspirations. Nothing else. */
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-title">Self</h1>
      <p className="text-3xl text-fg-muted">What moves us.</p>
      <nav aria-label="Inspiration" className="mt-10 flex flex-col gap-3 text-md sm:flex-row sm:gap-10">
        {[1, 2, 3].map((n) => (
          <Link key={n} href={`/inspiration/${n}` as Route} className="text-fg-muted hover:text-fg">
            Inspiration {n}
          </Link>
        ))}
      </nav>
    </main>
  );
}
