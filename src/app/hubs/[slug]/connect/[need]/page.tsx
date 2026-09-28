import type { Metadata } from "next";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { getOwnedHub, hubNumber } from "@/lib/hubs";
import { LIVE_PHASE, needFromSlug, NEEDS } from "@/lib/needs";
import { sortSteps, STAGE_COPY } from "@/lib/plan-order";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Connect · SELF" };

/**
 * A hub's connection area for one need (co-founder, legal, supplier…).
 * Shows which plan steps need it. The matching directory lands in its phase.
 */
export default async function ConnectPage({ params }: { params: Promise<{ slug: string; need: string }> }) {
  const { slug, need: needSlug } = await params;
  const need = needFromSlug(needSlug);
  if (!need) notFound();
  if (need === "COFOUNDER") redirect(`/hubs/${slug}/team` as Route);
  const viewer = await requireOnboarded();
  const hub = await getOwnedHub(slug, viewer);
  const area = NEEDS[need];
  const steps = sortSteps(await db.planStep.findMany({ where: { hubId: hub.id, needs: { has: need } } }));

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-16">
        <div className="flex justify-between gap-6">
          <ArrowLink href={`/hubs/${hub.slug}/plan`} size="inline" className="text-smoke">
            {hub.name} · Game plan
          </ArrowLink>
          <Label>
            {hubNumber(hub.number)} · {area.label}
          </Label>
        </div>
        <MaskedLines lines={[area.title]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">{area.line}</p>
      </section>

      <section className="grid grid-cols-1 gap-6 border-t border-line px-edge py-10 md:grid-cols-[16rem_1fr]">
        <Label className="self-start">Steps that need this</Label>
        <div className="flex flex-col">
          {steps.length === 0 ? (
            <p className="text-body text-smoke">No steps in your game plan are tagged {area.label} yet.</p>
          ) : (
            steps.map((s) => (
              <div key={s.id} className="border-b border-line py-4 last:border-b-0">
                <Label>{STAGE_COPY[s.stage].label}</Label>
                <p className={`mt-1 text-lead font-semibold ${s.doneAt ? "text-smoke line-through" : ""}`}>{s.title}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="border-t border-line px-edge py-[12vh]">
        {area.phase <= LIVE_PHASE ? null : (
          <>
            <Label tone="signal">Opens in Phase {area.phase}</Label>
            <p className="type-display mt-4 max-w-[20ch] text-headline">
              The people for this land here soon. Your steps will link straight to them.
            </p>
          </>
        )}
      </section>
    </PageWipe>
  );
}
