import Link from "next/link";
import { Arrow } from "@/components/ui/ArrowLink";

const links = [
  { href: "/style-guide", label: "Hubs" },
  { href: "/style-guide", label: "Partners" },
  { href: "/style-guide", label: "Backers" },
] as const;

/** Wordmark, a few text links, one persistent "Ask SELF anything →". */
export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-field">
      <nav className="flex h-14 items-center justify-between gap-6 px-edge">
        <Link href="/" className="type-display text-[1.375rem] leading-none tracking-[-0.04em]">
          SELF
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-small font-medium text-smoke transition-colors duration-(--duration-fast) hover:text-bone"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href="/ask"
          transitionTypes={["nav-forward"]}
          className="group inline-flex items-baseline gap-2 text-small font-semibold text-bone"
        >
          <span className="hidden sm:inline">Ask SELF anything</span>
          <span className="sm:hidden">Ask SELF</span>
          <Arrow className="text-signal" />
        </Link>
      </nav>
    </header>
  );
}
