import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { agentsLive } from "@/agents";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { personaText } from "@/lib/simulations";
import { requireOnboarded } from "@/lib/session";
import { OptInSwitch, PersonaEditor } from "./AgentControls";

export const metadata: Metadata = { title: "Your agent · SELF" };
export const maxDuration = 120;

export default async function AgentPage() {
  const { user, profile } = await requireOnboarded();
  const seats = await db.simulationParticipant.findMany({
    where: { userId: user.id },
    orderBy: { simulation: { createdAt: "desc" } },
    include: {
      simulation: {
        select: {
          id: true, scenarioTitle: true, status: true, createdAt: true,
          createdBy: { select: { id: true, name: true } },
          participants: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href="/me" size="inline" className="text-smoke">
            Your profile
          </ArrowLink>
          <Label>Your personal agent</Label>
        </div>
        <MaskedLines lines={["This is how your", "agent sees you."]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">
          Your agent is an AI stand-in used only in team simulations. The text below is exactly what it&apos;s given:
          nothing else about you. Change it any time.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-3 self-start">
          <Label>01 · Persona</Label>
          <p className="text-small text-smoke">What your agent is built from. Simulations freeze a copy when they start.</p>
        </div>
        <PersonaEditor
          initial={personaText(user.name, profile)}
          isDefault={!profile.persona}
          live={agentsLive()}
        />
      </section>

      <section className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-3 self-start">
          <Label>02 · Simulations</Label>
          <p className="text-small text-smoke">Off unless you turn it on.</p>
        </div>
        <div className="flex flex-col gap-6">
          <ul className="measure flex flex-col gap-2 text-body text-smoke">
            <li>Teammates, candidates and people you&apos;re connected to can include your agent in a simulation.</li>
            <li>Every simulation is labelled as one. It produces a transcript and conversation starters, never a score.</li>
            <li>You can see every simulation your agent took part in, below.</li>
            <li>Turning this off stops any simulation that includes you from continuing.</li>
          </ul>
          <OptInSwitch on={profile.simOptIn} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 pb-32 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-3 self-start">
          <Label>03 · Where your agent has been</Label>
          <ArrowLink href="/simulations" size="inline" className="text-smoke">
            All simulations
          </ArrowLink>
        </div>
        <div className="flex flex-col">
          {seats.length === 0 && <p className="text-lead text-smoke">Your agent hasn&apos;t been in a simulation yet.</p>}
          {seats.map(({ simulation: s }) => (
            <Link
              key={s.id}
              href={`/simulations/${s.id}` as Route}
              className="group flex flex-wrap items-baseline justify-between gap-4 border-b border-line py-4 last:border-b-0"
            >
              <div>
                <Label tone={s.status === "RUNNING" ? "signal" : "smoke"}>
                  Simulation · {s.status === "DONE" ? "Finished" : s.status === "RUNNING" ? "Running" : "Stopped"} ·{" "}
                  {s.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </Label>
                <p className="mt-1 text-lead font-semibold group-hover:underline">{s.scenarioTitle}</p>
                <p className="text-small text-smoke">
                  {s.createdBy.id === user.id ? "Started by you" : `Started by ${s.createdBy.name}`} · with{" "}
                  {s.participants.map((p) => p.user.name.split(" ")[0]).join(", ")}
                </p>
              </div>
              <span className="text-signal">→</span>
            </Link>
          ))}
        </div>
      </section>
    </PageWipe>
  );
}
