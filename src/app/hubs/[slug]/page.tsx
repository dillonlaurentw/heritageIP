import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Reveal } from "@/components/motion/Reveal";
import { HubCover } from "@/components/mosaic/HubCover";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile, type TileSpan } from "@/components/mosaic/Tile";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/Label";
import { getOwnedHub, hubNumber, STAGE_LABEL } from "@/lib/hubs";
import { requireOnboarded } from "@/lib/session";
import { THESIS_FIELDS } from "@/lib/thesis-schema";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return { title: `${(await params).slug.replace(/-/g, " ")} · SELF` };
}

const NEXT: { title: string; label: string; span: TileSpan }[] = [
  { title: "Game plan", label: "Phase 3 · Steps to launch", span: "square" },
  { title: "Team", label: "Phase 4 · Co-founders", span: "square" },
  { title: "Partners", label: "Phase 5 · Legal, supply, build", span: "square" },
  { title: "Backers", label: "Phase 6 · Interest only", span: "quarter" },
  { title: "Mentors", label: "Phase 7", span: "quarter" },
  { title: "Go-to-market", label: "Phase 8", span: "quarter" },
  { title: "Agents", label: "Phase 10", span: "quarter" },
];

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const hub = await getOwnedHub((await params).slug, viewer);
  const t = hub.thesis;

  return (
    <PageWipe>
      <section className="flex flex-col gap-8 px-edge pt-10 pb-10">
        <div className="flex justify-between gap-6">
          <Label>
            {hubNumber(hub.number)} · {STAGE_LABEL[hub.stage]}
          </Label>
          <ArrowLink href={`/hubs/${hub.slug}/edit`} size="inline" className="text-smoke">
            Edit hub
          </ArrowLink>
        </div>
        <MaskedLines lines={[hub.name]} className="type-display text-display" />
        {hub.oneLiner && <p className="measure text-lead text-smoke">{hub.oneLiner}</p>}
      </section>

      <Reveal className="px-gutter">
        <div className="h-[clamp(16rem,52vh,38rem)] overflow-hidden rounded-xs">
          <HubCover hub={hub} />
        </div>
      </Reveal>

      {t ? (
        <section className="mt-gutter bg-bone px-edge py-20 text-field">
          <div className="flex justify-between">
            <Label tone="field">01 · Core thesis</Label>
            <ArrowLink href={`/hubs/${hub.slug}/thesis`} size="inline" tone="field">
              Sharpen or edit
            </ArrowLink>
          </div>
          <p className="type-display mt-10 max-w-[30ch] text-statement">{t.statement}</p>
          <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-10 border-t border-line-bone pt-10 md:grid-cols-2 xl:grid-cols-3">
            {THESIS_FIELDS.map((f) => (
              <div key={f.key}>
                <Label tone="field">{f.label}</Label>
                <p className="mt-3 text-lead">{t[f.key]}</p>
              </div>
            ))}
            {t.openQuestions.length > 0 && (
              <div className="border-l-2 border-signal pl-5">
                <Label tone="field">Still open</Label>
                <ul className="mt-3 flex flex-col gap-2">
                  {t.openQuestions.map((q, i) => (
                    <li key={i} className="text-lead">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="mt-10 border-y border-line">
          <div className="px-edge pt-10">
            <Label>01 · Core thesis</Label>
          </div>
          <EmptyState line="No thesis yet. Make the idea hold up." href={`/hubs/${hub.slug}/thesis`} />
        </section>
      )}

      <section className="px-gutter pt-16 pb-24">
        <div className="px-[calc(var(--spacing-edge)-var(--spacing-gutter))] pb-6">
          <Label>02 · What comes next</Label>
        </div>
        <Mosaic>
          {NEXT.map((n, i) => (
            <Tile key={n.title} index={i} span={n.span} tone="field" label={n.label} title={n.title} />
          ))}
        </Mosaic>
      </section>
    </PageWipe>
  );
}
