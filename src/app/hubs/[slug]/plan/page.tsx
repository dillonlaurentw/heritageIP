import type { Metadata } from "next";
import { agentsLive } from "@/agents";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { getHubAccess, hubNumber } from "@/lib/hubs";
import { listSteps } from "@/lib/plan";
import { requireOnboarded } from "@/lib/session";
import { PlanBoard } from "./PlanBoard";

export const metadata: Metadata = { title: "Game plan · SELF" };
export const maxDuration = 120;

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const { hub, isOwner } = await getHubAccess((await params).slug, viewer);
  const steps = await listSteps(hub.id);

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between">
          <ArrowLink href={`/hubs/${hub.slug}`} size="inline" className="text-smoke">
            {hub.name}
          </ArrowLink>
          <Label>{hubNumber(hub.number)} · Game plan</Label>
        </div>
        <MaskedLines lines={["From idea", "to launch."]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">
          The concrete steps, in order. Each one is tagged with what it needs. Follow a tag to find the people
          who can help.
        </p>
      </section>
      <section className="px-edge pb-32">
        <PlanBoard
          hub={{ id: hub.id, slug: hub.slug, name: hub.name, hasThesis: Boolean(hub.thesis) }}
          initial={steps}
          live={agentsLive()}
          readOnly={!isOwner}
        />
      </section>
    </PageWipe>
  );
}
