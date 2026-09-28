import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { NotAnOffer } from "@/components/backers/NotAnOffer";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { coverTileTone } from "@/components/mosaic/CoverArt";
import { HubCover } from "@/components/mosaic/HubCover";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile, type TileSpan } from "@/components/mosaic/Tile";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label, Tag } from "@/components/ui/Label";
import { isBacker } from "@/lib/backers";
import { db } from "@/lib/db";
import { hubNumber, STAGE_LABEL } from "@/lib/hubs";
import { needFromSlug, NEED_TAGS, NEEDS } from "@/lib/needs";
import { FOCUS_AREAS } from "@/lib/profile-schema";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Discover · SELF" };

const RHYTHM: TileSpan[] = ["hero", "tall", "square", "square", "square", "half", "half"];
const STAGES = ["THESIS", "PLAN", "BUILDING", "LAUNCHED"] as const;

type Params = { s?: string; st?: string; n?: string };

function href(cur: Params, patch: Partial<Params>) {
  const next = { ...cur, ...patch };
  const q = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
  return (q.toString() ? `/backers?${q}` : "/backers") as Route;
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<Params> }) {
  const viewer = await requireOnboarded();
  const cur = await searchParams;

  if (!isBacker(viewer)) {
    return (
      <PageWipe>
        <section className="flex min-h-[70dvh] flex-col justify-between gap-10 px-edge pt-10 pb-12">
          <Label>Discover · For backers</Label>
          <div>
            <MaskedLines lines={["This is where", "backers look."]} className="type-display text-display" />
            <p className="measure mt-6 text-lead text-smoke">
              Backers browse hubs that have opted in. To see them, add the Backer role to your profile. To be found,
              open your own hub to backers from its page.
            </p>
            <ArrowLink href="/me" size="lead" tone="signal" className="mt-8">
              Add the Backer role
            </ArrowLink>
          </div>
        </section>
        <NotAnOffer />
      </PageWipe>
    );
  }

  const sector = FOCUS_AREAS.find((x) => x === cur.s);
  const stage = STAGES.find((x) => x === cur.st);
  const need = needFromSlug(cur.n ?? "");

  const hubs = await db.hub.findMany({
    where: {
      discoverable: true,
      ownerId: { not: viewer.user.id },
      ...(sector && { sector }),
      ...(stage && { stage }),
      ...(need && { planSteps: { some: { needs: { has: need }, doneAt: null } } }),
    },
    // Featured hubs (set by admins) lead the mosaic.
    orderBy: [{ featured: "desc" }, { discoverableAt: "desc" }],
    select: {
      id: true, slug: true, name: true, number: true, sector: true, stage: true, featured: true,
      coverLayout: true, coverTone: true, coverImageUrl: true,
      signals: { where: { kind: "BACKER_INTEREST", fromUserId: viewer.user.id, status: { in: ["PENDING", "ACCEPTED"] } }, select: { status: true } },
    },
  });

  const chip = (label: string, on: boolean, to: Route) => (
    <Link
      key={label}
      href={to}
      className={`rounded-xs border px-3 py-1.5 text-small font-medium transition-colors ${on ? "border-bone bg-bone text-field" : "border-line hover:border-smoke"}`}
    >
      {label}
    </Link>
  );

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-10">
        <div className="flex justify-between gap-6">
          <Label>Discover · For backers</Label>
          <Label>{String(hubs.length).padStart(2, "0")} open to backers</Label>
        </div>
        <MaskedLines lines={["Back the", "builders."]} className="type-display text-display" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="w-20">Sector</Label>
            {chip("Any", !sector, href(cur, { s: undefined }))}
            {FOCUS_AREAS.map((x) => chip(x, sector === x, href(cur, { s: x })))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="w-20">Stage</Label>
            {chip("Any", !stage, href(cur, { st: undefined }))}
            {STAGES.map((x) => chip(STAGE_LABEL[x], stage === x, href(cur, { st: x })))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="w-20">Needs</Label>
            {chip("Any", !need, href(cur, { n: undefined }))}
            {NEED_TAGS.filter((t) => t !== "FUNDING").map((t) => chip(NEEDS[t].label, need === t, href(cur, { n: NEEDS[t].slug })))}
          </div>
        </div>
      </section>

      {hubs.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState line="No hubs match. Widen the filters." href="/backers" />
        </div>
      ) : (
        <div className="px-gutter pb-16">
          <Mosaic>
            {hubs.map((h, i) => (
              <Tile
                key={h.id}
                index={i}
                span={hubs.length === 1 ? "wide" : RHYTHM[i % RHYTHM.length]}
                tone={coverTileTone(h)}
                href={`/backers/${h.slug}` as Route}
                label={`${hubNumber(h.number)} · ${h.sector ?? ""} · ${STAGE_LABEL[h.stage]}`}
                title={h.name}
                meta={
                  h.signals.length ? (
                    <Tag>{h.signals[0].status === "ACCEPTED" ? "Connected" : "Interested"}</Tag>
                  ) : h.featured ? (
                    <Tag>Featured</Tag>
                  ) : undefined
                }
                media={<HubCover hub={h} />}
              />
            ))}
          </Mosaic>
        </div>
      )}
      <NotAnOffer />
    </PageWipe>
  );
}
