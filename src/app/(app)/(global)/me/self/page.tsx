import type { Metadata, Route } from "next";
import Link from "next/link";
import { agentsLive } from "@/agents";
import { Topbar } from "@/components/shell/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { AgentMark } from "@/components/ui/AgentMark";
import { Card, Eyebrow } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { selfOf } from "@/lib/self";
import { requireOnboarded } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { lastWorkspaceSlug } from "@/lib/workspaces";
import { OpenToMatches } from "./OpenToMatches";
import { OptInSwitch } from "./OptInSwitch";
import { FindSuggestions, SelfLines, Suggestions } from "./SelfEditor";

export const metadata: Metadata = { title: "Your Self" };

/** Your Self: the AI version of you. Every line visible and editable; suggestions only count when you say yes. */
export default async function SelfPage() {
  const viewer = await requireOnboarded();
  const { user, profile } = viewer;
  const { doc } = selfOf(profile);
  const [seats, slug] = await Promise.all([
    db.simulationParticipant.findMany({
      where: { userId: user.id },
      orderBy: { simulation: { createdAt: "desc" } },
      take: 5,
      select: {
        simulation: {
          select: {
            id: true,
            scenarioTitle: true,
            createdAt: true,
            participants: { where: { userId: { not: user.id } }, select: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    lastWorkspaceSlug(user.id),
  ]);
  const pending = doc.suggestions.filter((s) => s.status === "PENDING");

  return (
    <>
      <Topbar crumbs={[{ label: "You", href: "/home" }, { label: "Your Self" }]} />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-12 px-6 pt-4 pb-24 md:px-12 lg:grid-cols-[1fr_22rem]">
        <main className="flex min-w-0 flex-col gap-7">
          <div className="flex flex-wrap items-center gap-6">
            <span className="relative">
              <Avatar name={user.name} size="xl" />
              <AgentMark mark="Self" size="sm" className="absolute -right-3 -bottom-1 w-9 ring-3 ring-bg" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h1 className="text-title font-medium">Your Self</h1>
              <p className="max-w-2xl text-md text-fg-muted">
                The AI version of you. It knows why you build, not just what. You can read and change every line.
              </p>
            </div>
            <FindSuggestions />
          </div>

          <Suggestions items={pending} live={agentsLive()} />
          <SelfLines lines={doc.lines} />
          <p className="text-sm text-fg-subtle">
            Your Self only uses what&apos;s written here. Nothing is guessed about you in secret, and suggestions count only
            when you say yes.
          </p>
        </main>

        <aside className="flex flex-col gap-8 lg:sticky lg:top-20">
          <Card className="flex flex-col gap-3 p-5">
            <OptInSwitch on={profile.simOptIn} label="Let your Self join rehearsals" />
            <p className="text-sm leading-relaxed text-fg-muted">
              Only with people you&apos;re connected to, and only if they opt in too. Turn it off any time; any rehearsal
              you&apos;re in stops.
            </p>
          </Card>

          <Card className="flex flex-col gap-3 p-5">
            <OpenToMatches on={profile.openToMatches} note={profile.openToMatchesNote ?? ""} />
          </Card>

          <div className="flex flex-col gap-2.5">
            <Eyebrow>Where your Self has been</Eyebrow>
            {seats.length === 0 ? (
              <p className="text-sm text-fg-subtle">No rehearsals yet.</p>
            ) : (
              seats.map(({ simulation: s }) => (
                <Link key={s.id} href={`/simulations/${s.id}` as Route} className="group">
                  <Card className="flex items-center gap-3 px-4 py-3 transition-shadow group-hover:shadow-lift">
                    <span className="rounded-sm bg-agent px-1.5 py-0.5 font-mono text-2xs text-fg-muted">SIM</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{s.scenarioTitle}</span>
                      <span className="truncate text-xs text-fg-subtle">
                        with {s.participants.map((p) => `${p.user.name.split(" ")[0]}'s Self`).join(", ") || "no one else"} ·{" "}
                        {formatDate(s.createdAt)}
                      </span>
                    </span>
                  </Card>
                </Link>
              ))
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <Eyebrow>Three kinds of help</Eyebrow>
            <Card className="flex flex-col divide-y divide-border overflow-hidden">
              <HelpRow title="Your Self" body="Shapes your thesis, explains your matches, speaks for you in rehearsals." />
              <HelpRow href="/simulations" title="Team rehearsals" body="Try a hard conversation before you have it for real." />
              <HelpRow
                href={slug ? `/w/${slug}/what-if` : "/home"}
                title="Business what-ifs"
                body="See what breaks in the plan before it happens."
              />
            </Card>
          </div>
        </aside>
      </div>
    </>
  );
}

function HelpRow({ href, title, body }: { href?: string; title: string; body: string }) {
  const inner = (
    <>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-sm text-fg-muted">{body}</span>
    </>
  );
  return href ? (
    <Link href={href as Route} className="flex flex-col gap-0.5 px-4 py-3 hover:bg-bg-hover">
      {inner}
    </Link>
  ) : (
    <div className="flex flex-col gap-0.5 px-4 py-3">{inner}</div>
  );
}
