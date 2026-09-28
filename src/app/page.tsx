import { ArrowRight, CheckSquare, FileText, Lightbulb, Target, Users, Waypoints } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { getViewer } from "@/lib/session";

/** The front door. Calm, product-first, one clear action. */
export default async function Landing() {
  const viewer = await getViewer();
  const cta = viewer ? { href: "/home" as const, label: "Open SELF" } : { href: "/sign-in" as const, label: "Get started" };

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          SELF
        </Link>
        <nav className="flex items-center gap-1">
          {!viewer && (
            <LinkButton href="/sign-in" variant="ghost">
              Sign in
            </LinkButton>
          )}
          <LinkButton href={cta.href} variant="primary">
            {cta.label}
          </LinkButton>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center md:pt-28">
          <p className="mb-5 text-sm font-medium text-accent-text">For the builders of the future</p>
          <h1 className="mx-auto max-w-4xl text-display font-semibold text-balance">Build your company in one place.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-fg-muted text-balance">
            From the first idea to running the business and the team: pages, plans and people in one workspace, with AI
            that works alongside you.
          </p>
          <div className="mt-9 flex items-center justify-center gap-2">
            <LinkButton href={cta.href} variant="primary" size="md" className="h-10 px-4">
              {cta.label} <ArrowRight className="size-4" />
            </LinkButton>
          </div>
        </section>

        <section aria-label="What SELF looks like" className="mx-auto max-w-6xl px-6">
          <ProductPreview />
        </section>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-24 md:grid-cols-3">
          <Feature
            icon={<Lightbulb />}
            title="Think it through"
            body="Start with a thought. SELF asks the hard questions, drafts your thesis and turns it into a staged game plan you can edit."
          />
          <Feature
            icon={<CheckSquare />}
            title="Run the business"
            body="Docs, tasks, meetings, goals, customers and suppliers, all as pages and databases. Everyone on the team sees the same plan."
          />
          <Feature
            icon={<Waypoints />}
            title="Find your people"
            body="Co-founders, mentors, manufacturing, legal and marketing partners, and backers who can open doors. Contact details are shared only when both sides say yes."
          />
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">What are you building?</h2>
            <LinkButton href={cta.href} variant="primary" size="md" className="h-10 px-4">
              {cta.label} <ArrowRight className="size-4" />
            </LinkButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-fg-subtle">
          <span>SELF · for the builders of the future</span>
          <span>SELF connects people. It doesn&apos;t move money or offer investments.</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex size-8 items-center justify-center rounded-md bg-accent-soft text-accent-text [&>svg]:size-4">{icon}</span>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="text-base leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}

/** A still of the workspace, drawn with the real tokens. */
function ProductPreview() {
  const steps: [string, string, string[], "gray" | "orange" | "green"][] = [
    ["Name the first buyer", "Validate", ["Customers"], "green"],
    ["Contract a local kelp press", "Build", ["Supplier"], "orange"],
    ["Food-contact certification", "Build", ["Legal"], "orange"],
    ["Pitch one processor", "Launch", ["Marketing"], "gray"],
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg shadow-dialog">
      <div className="flex h-[26rem]">
        <div className="hidden w-52 shrink-0 flex-col gap-0.5 border-r border-border bg-bg-subtle p-2 text-sm sm:flex">
          <div className="mb-2 flex items-center gap-2 px-1.5 py-1 font-semibold">
            <span className="flex size-5 items-center justify-center rounded-md bg-fg text-xs text-bg">T</span>
            Tidewater Kelp
          </div>
          {[
            [FileText, "Thesis"],
            [Target, "Game plan", true],
            [CheckSquare, "Tasks"],
            [Users, "Team"],
            [FileText, "Meeting notes"],
          ].map(([Icon, label, active]) => {
            const I = Icon as typeof FileText;
            return (
              <div
                key={label as string}
                className={`flex h-7 items-center gap-2 rounded-md px-2 ${active ? "bg-bg-active font-medium text-fg" : "text-fg-muted"}`}
              >
                <I className="size-4 text-fg-subtle" strokeWidth={1.75} />
                {label as string}
              </div>
            );
          })}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden px-6 pt-8 sm:px-12">
          <div className="text-left">
            <h3 className="text-2xl font-semibold tracking-tight">Game plan</h3>
            <p className="mt-1 text-sm text-fg-muted">From idea to launch, in stages. Tags show who you need.</p>
          </div>
          <div className="mt-6 overflow-hidden rounded-md border border-border text-left text-sm">
            <div className="grid grid-cols-[1fr_7rem_8rem] border-b border-border bg-bg-subtle text-xs text-fg-muted">
              <span className="px-3 py-2">Step</span>
              <span className="px-3 py-2">Stage</span>
              <span className="px-3 py-2">Needs</span>
            </div>
            {steps.map(([title, stage, needs, color]) => (
              <div key={title} className="grid grid-cols-[1fr_7rem_8rem] border-b border-border last:border-b-0">
                <span className="truncate px-3 py-2">{title}</span>
                <span className="px-3 py-2">
                  <Tag color="gray">{stage}</Tag>
                </span>
                <span className="flex gap-1 px-3 py-2">
                  {needs.map((n) => (
                    <Tag key={n} color={color}>
                      {n}
                    </Tag>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
