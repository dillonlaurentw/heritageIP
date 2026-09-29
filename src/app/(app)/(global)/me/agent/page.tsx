import type { Metadata, Route } from "next";
import Link from "next/link";
import { agentsLive } from "@/agents";
import { Screen } from "@/components/shell/Screen";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { personaText } from "@/lib/simulations";
import { formatDate } from "@/lib/time";
import { OptInSwitch, PersonaEditor } from "./AgentControls";

export const metadata: Metadata = { title: "Your agent" };

/** How your agent sees you: exactly the text it's given, the opt-in switch, and every simulation it was in. */
export default async function AgentPage() {
  const { user, profile } = await requireOnboarded();
  const seats = await db.simulationParticipant.findMany({
    where: { userId: user.id },
    orderBy: { simulation: { createdAt: "desc" } },
    select: {
      simulation: {
        select: {
          id: true,
          scenarioTitle: true,
          status: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true } },
          participants: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  return (
    <Screen
      crumbs={[{ label: "Profile", href: "/me" }, { label: "Your agent" }]}
      title="How your agent sees you"
      description="Your agent is an AI stand-in used only in team simulations. The text below is exactly what it's given, nothing else about you. Change it any time."
      width="narrow"
    >
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Persona</h2>
          <p className="text-sm text-fg-muted">What your agent is built from. Each simulation freezes a copy when it starts.</p>
          <PersonaEditor initial={personaText(user.name, profile)} isDefault={!profile.persona} live={agentsLive()} />
        </section>

        <section className="flex flex-col gap-3 border-t border-border pt-8">
          <h2 className="text-base font-semibold">Simulations</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-fg-muted">
            <li>Off unless you turn it on.</li>
            <li>Teammates, candidates and people you&apos;re connected to can include your agent in a simulation.</li>
            <li>Every simulation is labelled as one. It produces a transcript and conversation starters, never a score.</li>
            <li>You can see every simulation your agent took part in, below.</li>
            <li>Turning this off stops any simulation that includes you from continuing.</li>
          </ul>
          <OptInSwitch on={profile.simOptIn} />
        </section>

        <section className="flex flex-col gap-3 border-t border-border pt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Where your agent has been</h2>
            <Link href="/simulations" className="text-sm text-fg-muted hover:text-fg hover:underline">
              All simulations
            </Link>
          </div>
          {seats.length === 0 ? (
            <p className="text-sm text-fg-subtle">Your agent hasn&apos;t been in a simulation yet.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {seats.map(({ simulation: s }) => (
                <li key={s.id}>
                  <Link href={`/simulations/${s.id}` as Route} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-3 hover:bg-bg-hover">
                    <Tag color="purple">SIMULATION</Tag>
                    <span className="min-w-0 flex-1 truncate text-base font-medium">{s.scenarioTitle}</span>
                    <span className="text-xs text-fg-muted">
                      {s.createdBy.id === user.id ? "Started by you" : `Started by ${s.createdBy.name}`} · with {s.participants.map((p) => p.user.name.split(" ")[0]).join(", ")}
                    </span>
                    <span className="text-xs text-fg-subtle">
                      {s.status === "DONE" ? "Finished" : s.status === "RUNNING" ? "Running" : "Stopped"} · {formatDate(s.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Screen>
  );
}
