import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { CoverArt } from "@/components/mosaic/CoverArt";
import { SignalButtons } from "@/components/people/SignalButtons";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label, Tag } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { NEED_TO_CATEGORY, type Need } from "@/lib/needs";
import { CATEGORY_COPY } from "@/lib/partner-categories";
import { partnerContactsFor } from "@/lib/partners";
import { STAGE_COPY } from "@/lib/plan-order";
import { STATUS_LABEL } from "@/lib/signal-rules";
import { requireOnboarded } from "@/lib/session";
import { IntroForm } from "./IntroForm";

export const metadata: Metadata = { title: "Partner · SELF" };

export default async function PartnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ hub?: string; step?: string }>;
}) {
  const viewer = await requireOnboarded();
  const partner = await db.partner.findUnique({ where: { slug: (await params).slug } });
  if (!partner) notFound();
  const { hub: hubSlug, step: stepId } = await searchParams;
  const manages = partner.claimedById === viewer.user.id;

  // The viewer's hubs, with steps flagged when their needs match this partner.
  const hubs = manages
    ? []
    : await db.hub.findMany({
        where: { ownerId: viewer.user.id },
        orderBy: { updatedAt: "desc" },
        select: { id: true, slug: true, name: true, planSteps: { where: { doneAt: null }, select: { id: true, title: true, needs: true } } },
      });
  const hubOptions = hubs.map((h) => ({
    id: h.id,
    name: h.name,
    steps: h.planSteps.map((s) => ({
      id: s.id,
      title: s.title,
      relevant: s.needs.some((n) => {
        const cat = NEED_TO_CATEGORY[n as Need];
        return cat ? partner.categories.includes(cat) : false;
      }),
    })),
  }));
  const initialHub = hubs.find((h) => h.slug === hubSlug) ?? null;

  const [requests, contacts] = await Promise.all([
    db.signal.findMany({
      where: { kind: "PARTNER_INTRO", partnerId: partner.id, fromUserId: viewer.user.id },
      orderBy: { createdAt: "desc" },
      include: { hub: { select: { name: true } }, planStep: { select: { title: true } } },
    }),
    partnerContactsFor(viewer.user.id, [partner.id]),
  ]);
  const contact = contacts.get(partner.id);

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between gap-6">
          <ArrowLink href="/partners" size="inline" className="text-smoke">
            All partners
          </ArrowLink>
          <div className="flex items-center gap-3">
            {partner.featured && <Tag>Featured</Tag>}
            <Label>{partner.location}</Label>
          </div>
        </div>
        <MaskedLines lines={[partner.name]} className="type-display text-display" />
        <p className="measure text-lead">{partner.tagline}</p>
        <div className="flex flex-wrap gap-2">
          {partner.categories.map((c) => (
            <span key={c} className="label rounded-xs border border-line px-2 py-1 text-bone">
              {CATEGORY_COPY[c].label}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-gutter px-gutter md:grid-cols-[1fr_1.3fr]">
        <div className="aspect-[4/3] overflow-hidden rounded-xs md:aspect-auto md:min-h-96">
          <CoverArt name={partner.name} />
        </div>
        <div className="flex flex-col gap-10 rounded-xs bg-bone p-6 text-field md:p-8">
          <p className="text-lead">{partner.description}</p>
          <div className="grid grid-cols-1 gap-8 border-t border-line-bone pt-8 sm:grid-cols-2">
            <div>
              <Label tone="field">What they do</Label>
              <ul className="mt-3 flex flex-col gap-1.5">
                {partner.services.map((s) => (
                  <li key={s} className="text-body">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-6">
              {partner.stages.length > 0 && (
                <div>
                  <Label tone="field">Best at</Label>
                  <p className="mt-3 text-body">{partner.stages.map((s) => STAGE_COPY[s].label).join(", ")}</p>
                </div>
              )}
              {partner.priceNote && (
                <div>
                  <Label tone="field">Pricing</Label>
                  <p className="mt-3 text-body">{partner.priceNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-edge py-16 pb-32">
        {manages ? (
          <div className="flex flex-col gap-6">
            <Label tone="signal">You manage this profile</Label>
            <div className="flex flex-wrap gap-8">
              <ArrowLink href={`/partners/${partner.slug}/edit`} size="lead" tone="signal">
                Edit the profile
              </ArrowLink>
              <ArrowLink href="/connections" size="lead">
                Answer intro requests
              </ArrowLink>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col gap-8">
              <div>
                <Label>Work with them</Label>
                <p className="type-display mt-3 max-w-[14ch] text-headline">Ask SELF for an intro.</p>
                <p className="measure mt-4 text-body text-smoke">
                  {partner.claimedById
                    ? `${partner.name} answers on SELF.`
                    : `SELF's team makes this intro for you.`}{" "}
                  If they say yes, you both get each other&apos;s details by email.
                </p>
              </div>
              {contact && (
                <div className="flex flex-col gap-1">
                  <Label tone="signal">Contact · Intro accepted</Label>
                  <a href={`mailto:${contact.email}`} className="text-lead font-semibold underline decoration-1 underline-offset-4">
                    {contact.email}
                  </a>
                  {contact.website && (
                    <a href={contact.website} target="_blank" rel="noreferrer" className="text-small underline decoration-1 underline-offset-4">
                      {contact.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              )}
              {requests.length > 0 && (
                <div className="flex flex-col border-t border-line">
                  {requests.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
                      <div>
                        <Label tone={r.status === "PENDING" || r.status === "ACCEPTED" ? "signal" : "smoke"}>
                          {STATUS_LABEL[r.status]}
                        </Label>
                        <p className="text-body font-semibold">
                          {r.hub?.name}
                          {r.planStep && <span className="font-normal text-smoke"> · {r.planStep.title}</span>}
                        </p>
                      </div>
                      {r.status === "PENDING" && <SignalButtons signalId={r.id} mode="withdraw" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {hubOptions.length ? (
              <IntroForm
                partnerId={partner.id}
                partnerName={partner.name}
                hubs={hubOptions}
                initialHubId={initialHub?.id ?? null}
                initialStepId={initialHub?.id ? (stepId ?? null) : null}
              />
            ) : (
              <div className="flex flex-col gap-4">
                <p className="type-display text-headline">Intros are made for a hub.</p>
                <ArrowLink href="/hubs/new" size="lead" tone="signal">
                  Start a hub first
                </ArrowLink>
              </div>
            )}
          </div>
        )}
      </section>
    </PageWipe>
  );
}
