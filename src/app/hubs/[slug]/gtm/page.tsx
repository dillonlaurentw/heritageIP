import type { Metadata } from "next";
import { agentsLive } from "@/agents";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { GTM_COPY, GTM_SECTIONS } from "@/lib/gtm-sections";
import { getHubAccess, hubNumber } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";
import { GtmSectionEditor } from "./GtmSectionEditor";

export const metadata: Metadata = { title: "Go-to-market · SELF" };
export const maxDuration = 120;

export default async function GtmPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const { hub, isOwner } = await getHubAccess((await params).slug, viewer);
  const ws = await db.gtmWorkspace.findUnique({ where: { hubId: hub.id } });
  const written = GTM_SECTIONS.filter((s) => ws?.[s]?.trim()).length;

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href={`/hubs/${hub.slug}`} size="inline" className="text-smoke">
            {hub.name}
          </ArrowLink>
          <Label>
            {hubNumber(hub.number)} · Go-to-market · {written}/4 written
          </Label>
        </div>
        <MaskedLines lines={["Get it", "out there."]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">
          Positioning, customers, channels and a launch plan. Write them yourself, or let SELF draft one. Its drafts are
          proposals: nothing changes until you choose to use them.
        </p>
        {isOwner && (
          <div className="flex flex-wrap gap-6">
            <ArrowLink href={`/hubs/${hub.slug}/connect/marketing`} size="inline" className="text-smoke">
              Marketing partners
            </ArrowLink>
            <ArrowLink href={`/hubs/${hub.slug}/connect/gtm`} size="inline" className="text-smoke">
              Go-to-market partners
            </ArrowLink>
          </div>
        )}
      </section>

      {!hub.thesis && isOwner ? (
        <section className="border-t border-line px-edge py-[12vh]">
          <ArrowLink href={`/hubs/${hub.slug}/thesis`} size="hero" className="max-w-[18ch]">
            Write the thesis first. The workspace is built from it.
          </ArrowLink>
        </section>
      ) : isOwner ? (
        <div className="pb-24">
          {GTM_SECTIONS.map((s, i) => (
            <GtmSectionEditor key={s} hubId={hub.id} section={s} index={i} initial={ws?.[s] ?? ""} canAsk live={agentsLive()} />
          ))}
        </div>
      ) : (
        <div className="pb-24">
          {GTM_SECTIONS.map((s, i) => (
            <section key={s} className="grid grid-cols-1 gap-8 border-t border-line px-edge py-12 lg:grid-cols-[16rem_1fr]">
              <div className="flex flex-col gap-3 self-start">
                <Label>{String(i + 1).padStart(2, "0")} · Read only</Label>
                <h2 className="type-display text-title">{GTM_COPY[s].label}</h2>
              </div>
              <p className="whitespace-pre-line text-lead">{ws?.[s]?.trim() || <span className="text-smoke">Not written yet.</span>}</p>
            </section>
          ))}
        </div>
      )}
    </PageWipe>
  );
}
