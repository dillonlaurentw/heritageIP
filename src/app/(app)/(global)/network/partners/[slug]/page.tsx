import { Pencil } from "lucide-react";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { requestIntroAction } from "@/app/actions/network";
import { RequestForm } from "@/components/network/RequestForm";
import { Screen } from "@/components/shell/Screen";
import { LinkButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { NEED_TO_CATEGORY, type Need } from "@/lib/needs";
import { partnerContactsFor, workspaceOptions } from "@/lib/network";
import { CATEGORY_COPY } from "@/lib/partner-categories";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Partner" };

const STAGE_NAME: Record<string, string> = { VALIDATE: "Validate", SETUP: "Set up", BUILD: "Build", LAUNCH: "Launch" };

export default async function PartnerPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ws?: string; step?: string }> }) {
  const viewer = await requireOnboarded();
  const { ws, step } = await searchParams;
  const p = await db.partner.findUnique({
    where: { slug: (await params).slug },
    select: { id: true, name: true, tagline: true, description: true, categories: true, services: true, stages: true, location: true, priceNote: true, claimedById: true },
  });
  if (!p) notFound();
  const mine = p.claimedById === viewer.user.id;
  const [options, contacts, asked] = await Promise.all([
    mine ? [] : workspaceOptions(viewer),
    partnerContactsFor(viewer.user.id, [p.id]),
    db.signal.findMany({
      where: { kind: "PARTNER_INTRO", partnerId: p.id, fromUserId: viewer.user.id, status: { in: ["PENDING", "ACCEPTED"] } },
      select: { status: true, workspace: { select: { name: true } } },
    }),
  ]);
  const contact = contacts.get(p.id);
  // Pre-pick a step whose need maps to one of this partner's categories.
  const need = (Object.keys(NEED_TO_CATEGORY) as Need[]).find((n) => p.categories.includes(NEED_TO_CATEGORY[n]!));

  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Partners", href: "/network/partners" }, { label: p.name }]}
      width="narrow"
      actions={
        mine ? (
          <LinkButton href={`/network/partners/${(await params).slug}/edit` as Route} variant="ghost">
            <Pencil className="size-3.5" /> Edit profile
          </LinkButton>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
          <p className="mt-1 text-md text-fg-muted">{p.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {p.categories.map((c) => (
              <Tag key={c}>{CATEGORY_COPY[c].label}</Tag>
            ))}
            <span className="text-sm text-fg-subtle">· {p.location}</span>
          </div>
        </div>
        <p className="text-md leading-relaxed">{p.description}</p>
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-fg-muted">Services</dt>
          <dd>{p.services.join(" · ")}</dd>
          {p.stages.length > 0 && (
            <>
              <dt className="text-fg-muted">Best at</dt>
              <dd>{p.stages.map((s) => STAGE_NAME[s]).join(", ")}</dd>
            </>
          )}
          {p.priceNote && (
            <>
              <dt className="text-fg-muted">Pricing</dt>
              <dd>{p.priceNote}</dd>
            </>
          )}
        </dl>

        {contact && (
          <section className="rounded-lg bg-bg-subtle p-4 text-sm">
            <p className="text-xs font-medium text-fg-subtle">Intro made</p>
            <p className="mt-1">{contact.email}</p>
            {contact.website && <p className="text-fg-muted">{contact.website}</p>}
          </section>
        )}

        {!mine && (
          <div className="border-t border-border pt-5">
            {asked.length > 0 && (
              <p className="mb-4 text-sm text-fg-muted">
                {asked.map((a) => `${a.workspace?.name}: ${a.status === "ACCEPTED" ? "intro made" : "intro requested"}`).join(" · ")}
              </p>
            )}
            <h2 className="mb-3 text-base font-semibold">Ask for an intro</h2>
            <RequestForm
              options={options}
              targetId={p.id}
              send={requestIntroAction}
              cta="Request intro"
              placeholder={`What you need from ${p.name}, and roughly when.`}
              defaultWs={ws}
              defaultStep={step}
              preferNeed={need}
            />
          </div>
        )}
      </div>
    </Screen>
  );
}
