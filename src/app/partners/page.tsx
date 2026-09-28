import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { CoverArt, coverTileTone } from "@/components/mosaic/CoverArt";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile, type TileSpan } from "@/components/mosaic/Tile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label, Tag } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { CATEGORY_COPY, categoryFromSlug, PARTNER_CATEGORIES } from "@/lib/partner-categories";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Partners · SELF" };

const RHYTHM: TileSpan[] = ["wide", "square", "square", "square", "square", "quarter", "quarter", "quarter", "quarter", "half", "half"];

/** Keep ?hub=&step= so a request from a plan step stays tied to it. */
function withContext(path: string, ctx: { hub?: string; step?: string }) {
  const q = new URLSearchParams();
  if (ctx.hub) q.set("hub", ctx.hub);
  if (ctx.step) q.set("step", ctx.step);
  const s = q.toString();
  return (s ? `${path}${path.includes("?") ? "&" : "?"}${s}` : path) as Route;
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; hub?: string; step?: string }>;
}) {
  await requireOnboarded();
  const { c, hub, step } = await searchParams;
  const category = categoryFromSlug(c);
  const ctx = { hub, step };

  const [partners, stepRow] = await Promise.all([
    db.partner.findMany({
      where: category ? { categories: { has: category } } : {},
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    }),
    step ? db.planStep.findUnique({ where: { id: step }, select: { title: true, hub: { select: { name: true } } } }) : null,
  ]);

  const chip = (label: string, slug?: string) => {
    const on = (slug ?? null) === (category ? CATEGORY_COPY[category].slug : null);
    return (
      <Link
        key={label}
        href={withContext(slug ? `/partners?c=${slug}` : "/partners", ctx)}
        className={`rounded-xs border px-3 py-2 text-small font-medium transition-colors ${on ? "border-bone bg-bone text-field" : "border-line hover:border-smoke"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-10">
        <div className="flex justify-between gap-6">
          <Label>Partner directory</Label>
          <Label>
            {String(partners.length).padStart(2, "0")} {category ? CATEGORY_COPY[category].label : "partners"}
          </Label>
        </div>
        <MaskedLines lines={["The people who", "help you build."]} className="type-display text-display" />
        {stepRow && (
          <div className="flex flex-wrap items-center gap-3 border-l-2 border-signal pl-4">
            <Label tone="signal">For {stepRow.hub.name}</Label>
            <span className="text-lead">{stepRow.title}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {chip("All")}
          {PARTNER_CATEGORIES.map((cat) => chip(CATEGORY_COPY[cat].label, CATEGORY_COPY[cat].slug))}
        </div>
      </section>

      {partners.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState line="No partners here yet. Try another category." href="/partners" />
        </div>
      ) : (
        <div className="px-gutter pb-24">
          <Mosaic>
            {partners.map((p, i) => (
              <Tile
                key={p.id}
                index={i}
                span={RHYTHM[i % RHYTHM.length]}
                tone={coverTileTone(p)}
                href={withContext(`/partners/${p.slug}`, ctx)}
                label={`${CATEGORY_COPY[p.categories[0]].label} · ${p.location}`}
                title={p.name}
                meta={p.featured ? <Tag>Featured</Tag> : undefined}
                media={<CoverArt name={p.name} />}
              />
            ))}
          </Mosaic>
        </div>
      )}
    </PageWipe>
  );
}
