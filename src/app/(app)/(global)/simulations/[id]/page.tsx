import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Screen } from "@/components/shell/Screen";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { SimulationRoom } from "./SimulationRoom";

export const metadata: Metadata = { title: "Simulation" };
export const maxDuration = 120;

/** A simulation: transcript, controls for whoever started it, and conversation starters. Participants only. */
export default async function SimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireOnboarded();
  const sim = await db.simulation.findUnique({
    where: { id: (await params).id },
    include: {
      workspace: { select: { name: true } },
      createdBy: { select: { id: true, name: true } },
      participants: { orderBy: { order: "asc" }, include: { user: { select: { id: true, name: true } } } },
      turns: { orderBy: { index: "asc" }, include: { participant: { include: { user: { select: { id: true, name: true } } } } } },
      report: true,
    },
  });
  // Only the people whose agents took part can see a simulation.
  if (!sim || !sim.participants.some((p) => p.userId === viewer.user.id)) notFound();
  const driver = sim.createdById === viewer.user.id;
  const r = sim.report;

  return (
    <Screen crumbs={[{ label: "Simulations", href: "/simulations" }, { label: sim.scenarioTitle }]} width="narrow">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag color="purple">SIMULATION</Tag>
            <span className="text-xs text-fg-subtle">Not a real conversation</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{sim.scenarioTitle}</h1>
          <p className="mt-2 text-base text-fg-muted">{sim.scenarioBrief}</p>
          <p className="mt-3 text-xs text-fg-subtle">
            {driver ? "Started by you" : `Started by ${sim.createdBy.name}`}
            {sim.workspace && ` · ${sim.workspace.name}`} · {formatDate(sim.createdAt, true)}
          </p>
          {sim.status === "CANCELLED" && sim.cancelReason && <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">Stopped: {sim.cancelReason}</p>}
        </div>

        <SimulationRoom
          simId={sim.id}
          people={sim.participants.map((p) => ({ id: p.user.id, name: p.user.name }))}
          initialTurns={sim.turns.map((t) => ({ index: t.index, speakerId: t.participant.user.id, speaker: t.participant.user.name, text: t.text }))}
          maxTurns={sim.maxTurns}
          status={sim.status}
          hasReport={Boolean(r)}
          driver={driver}
          demo={sim.demo}
        />

        {r && (
          <section className="rounded-xl bg-surface shadow-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Tag color="purple">SIMULATION</Tag>
              <span className="text-xs text-fg-subtle">Conversation starters. No scores. Not a verdict on anyone.</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold">What the real people should talk about</h2>
            <p className="mt-1 text-sm text-fg-muted">
              These notes describe what AI stand-ins said in a rehearsal. Use them to start a conversation with the real people, never to decide about them.
            </p>
            <div className="mt-5 grid gap-6 md:grid-cols-3">
              {[
                { label: "Where they aligned", items: r.aligned },
                { label: "Where they pulled apart", items: r.clashed },
                { label: "Talk about this", items: r.talkAbout },
              ].map((col) => (
                <div key={col.label}>
                  <p className="text-xs font-medium text-fg-subtle">{col.label}</p>
                  <ul className="mt-2 flex flex-col gap-2 text-sm">
                    {col.items.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Screen>
  );
}
