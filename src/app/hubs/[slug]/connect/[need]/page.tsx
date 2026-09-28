import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { CoverArt, coverTileTone } from "@/components/mosaic/CoverArt";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile } from "@/components/mosaic/Tile";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label, Tag } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { getOwnedHub, hubNumber } from "@/lib/hubs";
import { LIVE_PHASE, NEED_TO_CATEGORY, needFromSlug, NEEDS } from "@/lib/needs";
import { CATEGORY_COPY } from "@/lib/partner-categories";
import { sortSteps, STAGE_COPY } from "@/lib/plan-order";
import { STATUS_LABEL } from "@/lib/signal-rules";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Connect · SELF" };

/**
 * A hub's connection area for one need (legal, supplier, website…): the plan
 * steps that need it, intros already requested, and matching partners.
 */
export default async function ConnectPage({ params }: { params: Promise<{ slug: string; need: string }> }) {
  const { slug, need: needSlug } = await params;
  const need = needFromSlug(needSlug);
  if (!need) notFound();
  if (need === "COFOUNDER") redirect(`/hubs/${slug}/team` as Route);
  if (need === "FUNDING") redirect(`/hubs/${slug}/backers` as Route);
  const viewer = await requireOnboarded();
  const hub = await getOwnedHub(slug, viewer);
  const area = NEEDS[need];
  const category = NEED_TO_CATEGORY[need] ?? null;

  const isMentor = need === "MENTOR";
  const [steps, partners, intros, mentors, mentorAsks] = await Promise.all([
    db.planStep.findMany({ where: { hubId: hub.id, needs: { has: need } } }).then(sortSteps),
    category
      ? db.partner.findMany({ where: { categories: { has: category } }, orderBy: [{ featured: "desc" }, { name: "asc" }], take: 5 })
      : [],
    category
      ? db.signal.findMany({
          where: { kind: "PARTNER_INTRO", hubId: hub.id, partner: { categories: { has: category } } },
          orderBy: { createdAt: "desc" },
          include: { partner: { select: { name: true, slug: true } }, planStep: { select: { title: true } } },
        })
      : [],
    isMentor
      ? db.user.findMany({
          where: {
            id: { not: viewer.user.id },
            profile: { roles: { has: "MENTOR" }, mentorOpen: true, ...(hub.sector && { focusAreas: { has: hub.sector } }) },
          },
          take: 5,
          select: { id: true, name: true, profile: { select: { headline: true, focusAreas: true } } },
        })
      : [],
    isMentor
      ? db.signal.findMany({
          where: { kind: "MENTOR_REQUEST", hubId: hub.id },
          orderBy: { createdAt: "desc" },
          include: { toUser: { select: { id: true, name: true } }, planStep: { select: { title: true } } },
        })
      : [],
  ]);
  const directory = category ? `/partners?c=${CATEGORY_COPY[category].slug}&hub=${hub.slug}` : "/partners";

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
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4 last:border-b-0">
                <div>
                  <Label>{STAGE_COPY[s.stage].label}</Label>
                  <p className={`mt-1 text-lead font-semibold ${s.doneAt ? "text-smoke line-through" : ""}`}>{s.title}</p>
                </div>
                {isMentor && !s.doneAt && (
                  <Link href={`/mentors?hub=${hub.slug}&step=${s.id}` as Route} className="group text-body font-semibold text-signal">
                    Find a mentor for this <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                )}
                {category && !s.doneAt && (
                  <Link
                    href={`${directory}&step=${s.id}` as Route}
                    className="group text-body font-semibold text-signal"
                  >
                    Find a partner for this <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {intros.length > 0 && (
        <section className="grid grid-cols-1 gap-6 border-t border-line px-edge py-10 md:grid-cols-[16rem_1fr]">
          <Label className="self-start">Intros requested</Label>
          <div className="flex flex-col">
            {intros.map((r) => (
              <div key={r.id} className="border-b border-line py-4 last:border-b-0">
                <Label tone={r.status === "PENDING" || r.status === "ACCEPTED" ? "signal" : "smoke"} live={r.status === "PENDING"}>
                  {STATUS_LABEL[r.status]}
                </Label>
                <p className="mt-1 text-lead font-semibold">
                  <Link href={`/partners/${r.partner?.slug}` as Route} className="hover:underline">
                    {r.partner?.name}
                  </Link>
                  {r.planStep && <span className="font-normal text-smoke"> · {r.planStep.title}</span>}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isMentor && mentorAsks.length > 0 && (
        <section className="grid grid-cols-1 gap-6 border-t border-line px-edge py-10 md:grid-cols-[16rem_1fr]">
          <Label className="self-start">Mentors asked</Label>
          <div className="flex flex-col">
            {mentorAsks.map((r) => (
              <div key={r.id} className="border-b border-line py-4 last:border-b-0">
                <Label tone={r.status === "PENDING" || r.status === "ACCEPTED" ? "signal" : "smoke"} live={r.status === "PENDING"}>
                  {STATUS_LABEL[r.status]}
                </Label>
                <p className="mt-1 text-lead font-semibold">
                  <Link href={`/mentors/${r.toUser.id}` as Route} className="hover:underline">
                    {r.toUser.name}
                  </Link>
                  {r.planStep && <span className="font-normal text-smoke"> · {r.planStep.title}</span>}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isMentor ? (
        <section className="border-t border-line pt-10 pb-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4 px-edge pb-6">
            <Label>{hub.sector ? `Mentors in ${hub.sector}` : "Mentors"}</Label>
            <ArrowLink href={`/mentors?hub=${hub.slug}${hub.sector ? `&f=${encodeURIComponent(hub.sector)}` : ""}` as Route} size="inline" className="text-smoke">
              See all
            </ArrowLink>
          </div>
          <div className="px-gutter">
            {mentors.length === 0 ? (
              <p className="px-edge text-lead text-smoke">No open mentors in this area yet.</p>
            ) : (
              <Mosaic>
                {mentors.map((m, i) => (
                  <Tile
                    key={m.id}
                    index={i}
                    span={i === 0 ? "wide" : "square"}
                    tone={i === 0 ? "bone" : "raised"}
                    href={`/mentors/${m.id}?hub=${hub.slug}` as Route}
                    label={m.profile?.focusAreas.slice(0, 3).join(" · ") ?? "Mentor"}
                    title={m.name}
                    subtitle={m.profile?.headline}
                  />
                ))}
              </Mosaic>
            )}
          </div>
        </section>
      ) : category ? (
        <section className="border-t border-line pt-10 pb-24">
          <div className="flex flex-wrap items-baseline justify-between gap-4 px-edge pb-6">
            <Label>{CATEGORY_COPY[category].label} partners</Label>
            <ArrowLink href={directory as Route} size="inline" className="text-smoke">
              See all
            </ArrowLink>
          </div>
          <div className="px-gutter">
            <Mosaic>
              {partners.map((p, i) => (
                <Tile
                  key={p.id}
                  index={i}
                  span={i === 0 ? "wide" : "square"}
                  tone={coverTileTone(p)}
                  href={`/partners/${p.slug}?hub=${hub.slug}` as Route}
                  label={`${p.location}`}
                  title={p.name}
                  meta={p.featured ? <Tag>Featured</Tag> : undefined}
                  media={<CoverArt name={p.name} />}
                />
              ))}
            </Mosaic>
          </div>
        </section>
      ) : (
        area.phase > LIVE_PHASE && (
          <section className="border-t border-line px-edge py-[12vh]">
            <Label tone="signal">Opens in Phase {area.phase}</Label>
            <p className="type-display mt-4 max-w-[20ch] text-headline">
              The people for this land here soon. Your steps will link straight to them.
            </p>
          </section>
        )
      )}
    </PageWipe>
  );
}
