import Link from "next/link";
import type { Route } from "next";

/** The public front door: few words, large type, the thesis first. */

const THESIS = [
  {
    title: "More than what they buy.",
    body: "Every choice comes from somewhere: what a person values, what they believe, what they're trying to become. Products only ever see the choice.",
  },
  {
    title: "Understanding that compounds.",
    body: "Each permitted interaction should leave a product knowing someone a little better, and carry forward to the next one.",
  },
  {
    title: "Theirs to give.",
    body: "Shared only with permission. Seen, corrected and taken back by the person it describes.",
  },
];

const LAYERS = [
  { word: "Actions", note: "What they did." },
  { word: "Preferences", note: "What they reach for." },
  { word: "Values", note: "What matters to them." },
  { word: "Beliefs", note: "Why. Only in their own words." },
];

const BUILD = [
  { word: "Connect", note: "Through the sign-in you already have." },
  { word: "Retrieve", note: "The context that matters, before you respond." },
  { word: "Improve", note: "From what actually happened." },
];

function Arrow({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-md text-fg">
      <span className="border-b border-fg/0 pb-0.5 transition-colors group-hover:border-border-strong">{children}</span>
      <span aria-hidden className="transition-transform duration-(--duration-base) group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Opening */}
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-7xl flex-col justify-between gap-16 px-6 pt-[8vh] pb-14 md:px-10">
        <h1 className="text-hero max-w-[11ch]">Understanding that carries forward.</h1>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-lg leading-relaxed text-fg-muted">
            Give your product and AI agents relevant customer context that improves with every permitted interaction.
          </p>
          <div className="flex gap-8">
            <Arrow href="/docs">Docs</Arrow>
            <Arrow href="/sandbox">Sandbox</Arrow>
          </div>
        </div>
      </section>

      {/* Thesis */}
      <section id="thesis" className="scroll-mt-4 border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          {THESIS.map((t, i) => (
            <div key={t.title} className="grid grid-cols-1 gap-4 border-b border-border py-16 last:border-0 md:grid-cols-[6rem_1fr_minmax(0,24rem)] md:gap-10 md:py-24">
              <span className="font-mono text-xs text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="text-title text-balance">{t.title}</h2>
              <p className="leading-relaxed text-fg-muted md:pt-3">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Layers */}
      <section className="bg-primary text-primary-fg">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-24 md:px-10 md:py-32">
          <p className="max-w-xl text-lg leading-relaxed opacity-70">
            Self holds four layers of understanding: structured, explained, and permissioned. Values and beliefs are never
            inferred from behaviour. They come only from what a person says.
          </p>
          <ul className="flex flex-col">
            {LAYERS.map((l) => (
              <li key={l.word} className="flex flex-col gap-2 border-t border-primary-fg/15 py-6 md:flex-row md:items-baseline md:justify-between">
                <span className="text-display">{l.word}</span>
                <span className="text-lg opacity-60">{l.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Discovery */}
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-24 md:grid-cols-[1fr_minmax(0,26rem)] md:px-10 md:py-32">
        <div className="flex flex-col gap-6">
          <span className="text-sm text-fg-subtle">It begins with discovery</span>
          <h2 className="text-title max-w-[16ch] text-balance">&ldquo;I&apos;d rather own one good jacket.&rdquo;</h2>
        </div>
        <div className="flex flex-col gap-5 md:self-end">
          <p className="text-lg leading-relaxed text-fg-muted">
            Said once, to one store. With Self, the next assistant she meets already knows, if she lets it. It stops offering
            five cheap ones.
          </p>
          <p className="text-sm text-fg-subtle">Illustrative. The first service is AI shopping and discovery.</p>
        </div>
      </section>

      {/* For builders */}
      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-24 md:px-10 md:py-32">
          <h2 className="text-title max-w-[18ch] text-balance">For the companies and agents that serve people.</h2>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {BUILD.map((b, i) => (
              <div key={b.word} className="flex flex-col gap-2 border-t border-fg pt-5">
                <span className="font-mono text-xs text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-2xl">{b.word}</span>
                <span className="text-fg-muted">{b.note}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-10">
            <Arrow href="/docs">Read the docs</Arrow>
            <Arrow href="/sandbox">Open the sandbox</Arrow>
          </div>
        </div>
      </section>
    </main>
  );
}
