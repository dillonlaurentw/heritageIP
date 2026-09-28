import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Simulations · SELF" };

export default async function SimulationsPage() {
  const viewer = await requireOnboarded();
  const sims = await db.simulation.findMany({
    where: { participants: { some: { userId: viewer.user.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      participants: { orderBy: { order: "asc" }, select: { user: { select: { name: true } } } },
      hub: { select: { name: true } },
    },
  });

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <Label tone="signal">Simulations</Label>
          <Label>{viewer.profile.simOptIn ? "Your agent: opted in" : "Your agent: opted out"}</Label>
        </div>
        <MaskedLines lines={["Rehearse before", "it's real."]} className="type-display text-display" />
        <div className="flex flex-wrap gap-8">
          <ArrowLink href="/simulations/new" size="lead" tone="signal">
            New simulation
          </ArrowLink>
          <ArrowLink href="/me/agent" size="lead">
            Your agent
          </ArrowLink>
        </div>
      </section>
      {sims.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState line="No simulations yet. Rehearse a hard conversation." href="/simulations/new" />
        </div>
      ) : (
        <section className="border-t border-line px-edge pb-32">
          {sims.map((s) => (
            <Link
              key={s.id}
              href={`/simulations/${s.id}` as Route}
              className="group grid grid-cols-1 gap-3 border-b border-line py-6 md:grid-cols-[16rem_1fr_auto] md:items-baseline"
            >
              <Label tone={s.status === "RUNNING" ? "signal" : "smoke"} live={s.status === "RUNNING"}>
                Simulation · {s.status === "DONE" ? "Finished" : s.status === "RUNNING" ? "Running" : "Stopped"}
              </Label>
              <div>
                <p className="type-display text-title transition-[--wdth] duration-(--duration-base) ease-out-strong group-hover:[--wdth:112]">
                  {s.scenarioTitle}
                </p>
                <p className="mt-1 text-small text-smoke">
                  {s.participants.map((p) => p.user.name.split(" ")[0]).join(", ")}
                  {s.hub && ` · ${s.hub.name}`} · {s.createdBy.id === viewer.user.id ? "started by you" : `started by ${s.createdBy.name}`}
                </p>
              </div>
              <Label>{s.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</Label>
            </Link>
          ))}
        </section>
      )}
    </PageWipe>
  );
}
