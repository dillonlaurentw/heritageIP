import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { eligiblePeople } from "@/lib/simulations";
import { requireOnboarded } from "@/lib/session";
import { NewSimulationForm } from "./NewSimulationForm";

export const metadata: Metadata = { title: "New simulation · SELF" };

export default async function NewSimulationPage() {
  const viewer = await requireOnboarded();
  const [people, hubs] = await Promise.all([
    eligiblePeople(viewer.user.id),
    db.hub.findMany({
      where: { OR: [{ ownerId: viewer.user.id }, { members: { some: { userId: viewer.user.id } } }] },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  people.sort((a, b) => Number(b.optedIn) - Number(a.optedIn));

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href="/simulations" size="inline" className="text-smoke">
            Simulations
          </ArrowLink>
          <Label tone="signal">Simulation</Label>
        </div>
        <MaskedLines lines={["Rehearse the hard", "conversation."]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">
          AI stand-ins for you and your people talk through a real situation, built only from what each person wrote and
          approved. You get the transcript and what to talk about next. It&apos;s a rehearsal, not a verdict.
        </p>
        {!viewer.profile.simOptIn && (
          <ArrowLink href="/me/agent" size="lead" tone="signal">
            First, let your own agent join simulations
          </ArrowLink>
        )}
      </section>
      <section className="border-t border-line px-edge pt-12">
        <NewSimulationForm people={people} hubs={hubs} meOptedIn={viewer.profile.simOptIn} />
      </section>
    </PageWipe>
  );
}
