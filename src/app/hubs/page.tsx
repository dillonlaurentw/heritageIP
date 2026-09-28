import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { HubMosaic } from "@/components/mosaic/HubMosaic";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/Label";
import { listHubs } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Your hubs · SELF" };

export default async function HubsPage() {
  const viewer = await requireOnboarded();
  const hubs = await listHubs(viewer.user.id);

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between">
          <Label>Your hubs</Label>
          <Label>{String(hubs.length).padStart(2, "0")} total</Label>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <MaskedLines lines={["The work."]} className="type-display text-hero" />
          {hubs.length > 0 && (
            <ArrowLink href="/hubs/new" size="lead" tone="signal">
              Start another
            </ArrowLink>
          )}
        </div>
      </section>
      {hubs.length ? (
        <div className="px-gutter pb-24">
          <HubMosaic hubs={hubs} />
        </div>
      ) : (
        <div className="border-t border-line">
          <EmptyState line="No hubs yet. Start with a thought." href="/hubs/new" />
        </div>
      )}
    </PageWipe>
  );
}
