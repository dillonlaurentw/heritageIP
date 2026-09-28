import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { SimulationRoom } from "./SimulationRoom";

export const metadata: Metadata = { title: "Simulation · SELF" };
export const maxDuration = 120;

export default async function SimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireOnboarded();
  const sim = await db.simulation.findUnique({
    where: { id: (await params).id },
    include: {
      hub: { select: { name: true } },
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
    <PageWipe>
      <section className="flex flex-col gap-8 px-edge pt-10 pb-10">
        <div className="flex justify-between gap-6">
          <ArrowLink href="/simulations" size="inline" className="text-smoke">
            Simulations
          </ArrowLink>
          <Label tone="signal">Simulation · Not a real conversation</Label>
        </div>
        <MaskedLines lines={[sim.scenarioTitle]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">{sim.scenarioBrief}</p>
        <Label>
          {driver ? "Started by you" : `Started by ${sim.createdBy.name}`}
          {sim.hub && ` · ${sim.hub.name}`} · {sim.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </Label>
        {sim.status === "CANCELLED" && sim.cancelReason && <Label tone="signal">Stopped · {sim.cancelReason}</Label>}
      </section>

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
        <section className="mt-16 bg-bone px-edge py-16 text-field">
          <div className="flex flex-wrap justify-between gap-4">
            <Label tone="field">Conversation starters · Simulation</Label>
            <Label tone="field">No scores. Not a verdict on anyone.</Label>
          </div>
          <p className="type-display mt-8 max-w-[26ch] text-headline">What the real people should talk about.</p>
          <p className="measure mt-4 text-body">
            These notes describe what AI stand-ins said in a rehearsal. Use them to start a conversation with the real
            people, never to decide about them.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-10 border-t border-line-bone pt-10 lg:grid-cols-3">
            {[
              { label: "Where they aligned", items: r.aligned },
              { label: "Where they pulled apart", items: r.clashed },
              { label: "Talk about this", items: r.talkAbout },
            ].map((col) => (
              <div key={col.label}>
                <Label tone="field">{col.label}</Label>
                <ul className="mt-4 flex flex-col gap-4">
                  {col.items.map((it, i) => (
                    <li key={i} className={`text-lead ${col.label === "Talk about this" ? "font-semibold" : ""}`}>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-edge py-16 pb-32">
        <div className="flex flex-wrap gap-8">
          <ArrowLink href="/simulations/new" size="lead" tone="signal">
            Run another
          </ArrowLink>
          <ArrowLink href="/me/agent" size="lead">
            Your agent and opt-in
          </ArrowLink>
        </div>
      </section>
    </PageWipe>
  );
}
