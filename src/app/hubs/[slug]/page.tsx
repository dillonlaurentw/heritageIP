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
import { getHubAccess, hubNumber, STAGE_LABEL } from "@/lib/hubs";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { THESIS_FIELDS } from "@/lib/thesis-schema";
import { NeedTag } from "@/components/plan/NeedTag";
import { listSteps } from "@/lib/plan";
import { STAGE_COPY } from "@/lib/plan-order";
import type { Route } from "next";

const pad = (n: number) => String(n).padStart(2, "0");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return { title: `${(await params).slug.replace(/-/g, " ")} · SELF` };
}

const NEXT: { title: string; label: string; span: TileSpan; path: string }[] = [
  { title: "Team", label: "Co-founders", span: "square", path: "team" },
  { title: "Partners", label: "Legal, supply, build · Phase 5", span: "square", path: "connect/legal" },
  { title: "Backers", label: "Interest only", span: "square", path: "backers" },
  { title: "Mentors", label: "People who have done it", span: "square", path: "connect/mentor" },
  { title: "Go-to-market", label: "Phase 8", span: "square", path: "connect/gtm" },
  { title: "Agents", label: "Phase 10", span: "square", path: "" },
];

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const { hub, isOwner, membership } = await getHubAccess((await params).slug, viewer);
  const [teamSize, openRoles, waiting] = await Promise.all([
    db.hubMember.count({ where: { hubId: hub.id } }),
    db.roleOpening.count({ where: { hubId: hub.id, status: "OPEN" } }),
    isOwner ? db.signal.count({ where: { hubId: hub.id, toUserId: viewer.user.id, status: "PENDING" } }) : 0,
  ]);
  const t = hub.thesis;
  const steps = await listSteps(hub.id);
  const plan = { done: steps.filter((st) => st.done).length, total: steps.length };
  const nextSteps = steps.filter((st) => !st.done).slice(0, 3);

  return (
    <PageWipe>
      <section className="flex flex-col gap-8 px-edge pt-10 pb-10">
        <div className="flex justify-between gap-6">
          <Label>
            {hubNumber(hub.number)} · {STAGE_LABEL[hub.stage]}
          </Label>
          {isOwner ? (
            <ArrowLink href={`/hubs/${hub.slug}/edit`} size="inline" className="text-smoke">
              Edit hub
            </ArrowLink>
          ) : (
            <Label tone="bone">You&apos;re on the team · {membership?.role}</Label>
          )}
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
            {isOwner && (
              <ArrowLink href={`/hubs/${hub.slug}/thesis`} size="inline" tone="field">
                Sharpen or edit
              </ArrowLink>
            )}
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

      {t && (
        <section className="border-b border-line px-edge py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <Label>
              02 · Game plan{plan.total > 0 && ` · Step ${pad(plan.done)}/${pad(plan.total)} done`}
            </Label>
            {plan.total > 0 && (
              <ArrowLink href={`/hubs/${hub.slug}/plan`} size="inline" className="text-smoke">
                Open the game plan
              </ArrowLink>
            )}
          </div>
          {plan.total === 0 && !isOwner ? (
            <p className="pt-8 text-lead text-smoke">No plan yet.</p>
          ) : plan.total === 0 ? (
            <div className="pt-10">
              <ArrowLink href={`/hubs/${hub.slug}/plan`} size="hero" className="max-w-[18ch]">
                No plan yet. Turn the thesis into steps.
              </ArrowLink>
            </div>
          ) : (
            <>
              <div className="mt-6 h-px bg-line">
                <div className="h-px bg-signal" style={{ width: `${(plan.done / plan.total) * 100}%` }} />
              </div>
              <div className="mt-8 grid grid-cols-1 gap-gutter md:grid-cols-3">
                {nextSteps.map((st, i) => (
                  <div key={st.id} className="flex min-h-48 flex-col justify-between gap-6 rounded-xs bg-field-raised p-5">
                    <Label tone={i === 0 ? "signal" : "smoke"}>
                      {i === 0 ? "Next up" : "Then"} · {STAGE_COPY[st.stage].label}
                    </Label>
                    <div>
                      <p className="type-display text-title">{st.title}</p>
                      {st.needs.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {st.needs.map((n) => (
                            <NeedTag key={n} need={n} hubSlug={hub.slug} stepId={st.id} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {nextSteps.length === 0 && (
                  <p className="type-display text-headline md:col-span-3">Every step done. Time to launch.</p>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <section className="px-gutter pt-16 pb-24">
        <div className="px-[calc(var(--spacing-edge)-var(--spacing-gutter))] pb-6">
          <Label>03 · What comes next</Label>
        </div>
        <Mosaic>
          {NEXT.map((n, i) => (
            <Tile
              key={n.title}
              index={i}
              span={n.span}
              tone={n.path === "team" && waiting > 0 ? "signal" : n.path === "team" ? "raised" : "field"}
              label={
                n.path === "team"
                  ? `${teamSize + 1} ${teamSize ? "people" : "person"} · ${openRoles} open ${openRoles === 1 ? "role" : "roles"}${waiting ? ` · ${waiting} waiting` : ""}`
                  : n.path === "backers"
                    ? hub.discoverable
                      ? "Open to backers · Interest only"
                      : "Not discoverable · Interest only"
                    : n.label
              }
              title={n.title}
              href={n.path && (isOwner || n.path === "team") ? (`/hubs/${hub.slug}/${n.path}` as Route) : undefined}
            />
          ))}
        </Mosaic>
      </section>
    </PageWipe>
  );
}
