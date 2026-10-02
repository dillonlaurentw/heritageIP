import Link from "next/link";
import { Brush, Walker } from "@/components/site/Sketch";

/**
 * The Self front door. One drawing, three paragraphs that say plainly what
 * Self is, one thing to do next. No headline banner, no sections, no menu.
 */
export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-14 pb-16 md:pt-24">
        <Walker className="-ml-2 size-28 text-fg md:size-32" />

        <div className="mt-20 flex flex-col gap-7 text-xl text-fg md:mt-28 md:text-2xl">
          <h1 className="font-medium">
            Understanding that carries forward. Self gives your product and AI agents relevant context about the people they
            serve, and it improves with every interaction a person allows.
          </h1>
          <p>
            People are more than what they buy. Self keeps what someone chooses, what they prefer, what they value and what
            they believe, structured and explained, so the next conversation starts where the last one left off.
          </p>
          <p>
            There&apos;s nothing new for your customers to learn. Self connects through the sign-in you already have. Your
            product asks before it responds and says what happened after.
          </p>
          <p>
            It belongs to the person. Values and beliefs come only from their own words, never guessed from behaviour.
            Understanding moves between services only when they say yes, and they can take it back.
          </p>
        </div>

        <div className="mt-20 flex flex-col gap-8 md:mt-24">
          <Link href="/sandbox" className="group relative self-start text-xl font-medium text-fg md:text-2xl">
            Open the sandbox to get started
            <Brush className="absolute -bottom-7 left-[28%] h-7 w-[76%] text-brush transition-transform duration-(--duration-slow) group-hover:translate-x-1" />
          </Link>
          <Link href="/docs" className="self-start text-md text-fg-muted hover:text-fg">
            Or read the docs →
          </Link>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 py-8 text-sm text-fg">
        <span>© 2026 Self. Early development; the sandbox uses synthetic people.</span>
        <span className="flex gap-6">
          <Link href="/docs" className="hover:text-fg-muted">
            Docs
          </Link>
          <Link href="/docs#sharing" className="hover:text-fg-muted">
            Permission
          </Link>
        </span>
      </footer>
    </div>
  );
}
