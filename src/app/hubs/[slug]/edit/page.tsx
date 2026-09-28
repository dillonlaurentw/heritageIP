import type { Metadata } from "next";
import { PageWipe } from "@/components/motion/PageWipe";
import type { CoverLayout, CoverTone } from "@/components/mosaic/CoverArt";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { getOwnedHub, hubNumber } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";
import { uploadsEnabled } from "@/lib/storage";
import { HubEditor } from "./HubEditor";

export const metadata: Metadata = { title: "Edit hub · SELF" };

export default async function EditHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const hub = await getOwnedHub((await params).slug, viewer);

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-16">
        <div className="flex justify-between">
          <ArrowLink href={`/hubs/${hub.slug}`} size="inline" className="text-smoke">
            {hub.name}
          </ArrowLink>
          <Label>{hubNumber(hub.number)} · Edit</Label>
        </div>
        <h1 className="type-display text-display">Edit hub.</h1>
      </section>
      <section className="px-edge">
        <HubEditor
          uploads={uploadsEnabled()}
          hub={{
            id: hub.id,
            slug: hub.slug,
            number: hub.number,
            name: hub.name,
            oneLiner: hub.oneLiner ?? "",
            coverLayout: hub.coverLayout as CoverLayout | null,
            coverTone: hub.coverTone as CoverTone | null,
            coverImageUrl: hub.coverImageUrl,
          }}
        />
      </section>
    </PageWipe>
  );
}
