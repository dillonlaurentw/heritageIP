import Link from "next/link";
import { Ring } from "@/components/ring/Ring";
import { LinkButton } from "@/components/ui/Button";
import type { RingNode } from "@/lib/ring";
import { getViewer } from "@/lib/session";

/** A founder three months in: what the ring looks like once people arrive. */
const SAMPLE: RingNode[] = [
  { id: "c1", theme: "COFOUNDERS", kind: "person", state: "linked", name: "Dev Raman", note: "co-founder" },
  { id: "c2", theme: "COFOUNDERS", kind: "open", state: "open", name: "Brand and story", note: "an open chair" },
  { id: "p1", theme: "PARTNERS", kind: "firm", state: "linked", name: "Harbor & Vine", note: "legal partner" },
  { id: "p2", theme: "PARTNERS", kind: "firm", state: "linked", name: "Northloop Sourcing", note: "manufacturing" },
  { id: "p3", theme: "PARTNERS", kind: "firm", state: "pending", name: "Iberia Fibre", note: "intro pending" },
  { id: "a1", theme: "ADVISORS", kind: "person", state: "linked", name: "Rosa Almeida", note: "mentor" },
  { id: "k1", theme: "CAPITAL", kind: "person", state: "pending", name: "Priya Nair", note: "following along" },
];

/** The front door: one idea (you, and the people around you) and one action. */
export default async function Landing() {
  const viewer = await getViewer();
  const cta = viewer ? { href: "/home" as const, label: "Open SELF" } : { href: "/sign-in" as const, label: "Begin with you" };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6 md:px-16">
        <Link href="/" className="text-[17px] font-semibold tracking-[0.18em]">
          SELF
        </Link>
        <nav className="flex items-center gap-6 text-sm text-fg-muted">
          <span className="hidden md:inline">For founders</span>
          <span className="hidden md:inline">For backers</span>
          <span className="hidden md:inline">For partners</span>
          {viewer ? (
            <LinkButton href="/home" variant="secondary" size="sm">
              Open SELF
            </LinkButton>
          ) : (
            <Link href="/sign-in" className="font-medium text-fg hover:text-accent-text">
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-6 pt-6 pb-16 md:px-16 lg:grid-cols-[1fr_auto]">
        <section className="flex max-w-xl flex-col gap-7">
          <span className="text-sm text-fg-subtle">Private beta</span>
          <h1 className="text-display font-medium text-balance">Back people, not just companies.</h1>
          <p className="text-lg leading-relaxed text-fg-muted">
            SELF is where you find the people your idea needs, and build the company with them. Co-founders. Partners.
            Advisors. Capital. All around you.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href={cta.href} variant="primary" size="lg">
              {cta.label}
            </LinkButton>
            {!viewer && (
              <LinkButton href="/sign-in" variant="secondary" size="lg">
                I back or help founders
              </LinkButton>
            )}
          </div>
        </section>
        <section aria-label="Your ring, three months in" className="hidden justify-center sm:flex">
          <Ring nodes={SAMPLE} size={440} />
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-3 px-6 py-8 text-sm text-fg-subtle md:px-16">
        <span>Every relationship starts with a request and becomes real with a yes.</span>
        <span>SELF connects people. It doesn&apos;t move money or offer investments.</span>
      </footer>
    </div>
  );
}
