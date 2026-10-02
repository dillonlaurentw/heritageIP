import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

/**
 * The Self front door. One quiet page: what Self is, one example of
 * understanding carrying forward, and one thing to do next.
 */

const THREAD = [
  {
    when: "March",
    where: "Cadence Outdoor",
    said: "“I’d rather own one good jacket than five cheap ones.”",
    kept: "Values: buy less, buy better. In her words.",
  },
  {
    when: "June",
    where: "Cadence Outdoor",
    said: "Returned a puffer. Too warm for cycling.",
    kept: "Avoids synthetic down. Learned from the return.",
  },
  {
    when: "Today",
    where: "A new assistant",
    said: "She asks for a jacket for riding to work.",
    kept: "It already knows both, and why, because she said it could.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-2xl px-6 pt-10">
        <span className="font-display text-[28px] leading-none">Self</span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-20 pb-20 md:pt-28">
        <h1 className="text-title text-balance">Understanding that carries forward.</h1>
        <p className="mt-8 text-xl text-fg-muted">
          Give your product and AI agents relevant customer context that improves with every permitted interaction. More than
          what people buy: what they prefer, what they value, what they believe.
        </p>

        <ol className="mt-20 flex flex-col" aria-label="An example with a synthetic customer">
          {THREAD.map((t, i) => (
            <li key={t.when} className="relative grid grid-cols-[4.5rem_1fr] gap-x-5 pb-10 last:pb-0">
              {i < THREAD.length - 1 && <span aria-hidden className="absolute top-3 bottom-0 left-[5.68rem] w-px bg-border-strong" />}
              <span className="pt-0.5 font-mono text-xs text-fg-subtle">{t.when}</span>
              <div className="relative flex flex-col gap-1.5 pl-6">
                <span aria-hidden className={`absolute top-2 left-[-0.21rem] size-2 rounded-full ${i === THREAD.length - 1 ? "bg-accent" : "bg-fg"}`} />
                <span className="text-sm text-fg-subtle">{t.where}</span>
                <span className="text-lg">{t.said}</span>
                <span className="text-fg-muted">{t.kept}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 pl-[6.75rem] text-sm text-fg-subtle">An example with a synthetic customer.</p>

        <div className="mt-20 flex flex-col gap-5 text-lg leading-relaxed text-fg-muted">
          <p>
            Nothing new for your customers to learn. Self works behind the sign-in you already have: your product asks before
            it responds, and says what happened after.
          </p>
          <p>
            It belongs to the person. Values and beliefs come only from their own words, never guessed from behaviour.
            Understanding moves between services only when they say yes, and they can take it back.
          </p>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-6">
          <LinkButton href="/sandbox" variant="primary" size="lg">
            Open the sandbox
          </LinkButton>
          <Link href="/docs" className="text-md text-fg-muted hover:text-fg">
            Read the docs →
          </Link>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-2xl flex-wrap justify-between gap-x-8 gap-y-2 border-t border-border px-6 py-8 text-sm text-fg-subtle">
        <span>Self is in early development. The sandbox uses synthetic people; nothing here is live.</span>
        <span className="flex gap-6">
          <Link href="/docs" className="hover:text-fg">
            Docs
          </Link>
          <Link href="/docs#sharing" className="hover:text-fg">
            Permission
          </Link>
        </span>
      </footer>
    </div>
  );
}
