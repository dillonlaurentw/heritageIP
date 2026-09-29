import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { NotAnOffer } from "@/components/network/NotAnOffer";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { Card, Eyebrow, NeedsDot } from "@/components/ui/Card";
import { WorkspaceMark } from "@/components/ui/PageIcon";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/time";
import { initials } from "@/lib/ring";

/** A backer's home: companies you follow, and companies open to backers now. Interest only. */
export async function BackerHome({ viewerId, first }: { viewerId: string; first: string }) {
  const [interests, open] = await Promise.all([
    db.signal.findMany({
      where: { kind: "BACKER_INTEREST", fromUserId: viewerId, status: { in: ["PENDING", "ACCEPTED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, createdAt: true, workspace: { select: { id: true, slug: true, name: true, icon: true, oneLiner: true } } },
    }),
    db.workspace.findMany({
      where: { kind: "TEAM", discoverable: true },
      orderBy: [{ featured: "desc" }, { discoverableAt: "desc" }],
      take: 12,
      select: { id: true, slug: true, name: true, icon: true, oneLiner: true, sector: true },
    }),
  ]);
  const following = new Set(interests.map((i) => i.workspace?.id));
  const fresh = open.filter((w) => !following.has(w.id)).slice(0, 6);
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-medium">Hello, {first}.</h1>
        <p className="text-md text-fg-muted">The founders you follow, and who&apos;s open to backers now.</p>
      </div>

      <section className="flex flex-col gap-3">
        <Eyebrow>Companies you follow</Eyebrow>
        {interests.length === 0 ? (
          <p className="text-sm text-fg-subtle">None yet. When you signal interest in a company, it shows up here.</p>
        ) : (
          interests.map(
            (i) =>
              i.workspace && (
                <Link key={i.id} href={`/network/backers/${i.workspace.slug}` as Route} className="group">
                  <Card className="flex items-center gap-4 px-5 py-4 transition-shadow group-hover:shadow-lift">
                    <WorkspaceMark name={i.workspace.name} icon={i.workspace.icon} size="md" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-base font-medium">{i.workspace.name}</span>
                      <span className="truncate text-sm text-fg-muted">{i.workspace.oneLiner}</span>
                    </span>
                    <span className="text-sm text-fg-muted">{i.status === "ACCEPTED" ? "In touch" : `Waiting for a yes · ${timeAgo(i.createdAt)}`}</span>
                    <ArrowRight className="size-4 text-fg-subtle" />
                  </Card>
                </Link>
              ),
          )
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Eyebrow>Open to backers now</Eyebrow>
          <LinkButton href="/network/backers" variant="ghost" size="xs">
            See all
          </LinkButton>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fresh.map((w) => (
            <Link key={w.id} href={`/network/backers/${w.slug}` as Route} className="group">
              <Card className="flex h-full items-start gap-3 p-4 transition-shadow group-hover:shadow-lift">
                <WorkspaceMark name={w.name} icon={w.icon} size="md" />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-base font-medium">{w.name}</span>
                  <span className="line-clamp-2 text-sm text-fg-muted">{w.oneLiner}</span>
                  {w.sector && <span className="text-xs text-fg-subtle">{w.sector}</span>}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <NotAnOffer />
    </div>
  );
}

/** A partner's home: intros waiting for an answer, and the founders you already work with. */
export async function PartnerHome({ viewerId, first }: { viewerId: string; first: string }) {
  const [firm, intros] = await Promise.all([
    db.partner.findUnique({ where: { claimedById: viewerId }, select: { slug: true, name: true, tagline: true } }),
    db.signal.findMany({
      where: { kind: "PARTNER_INTRO", toUserId: viewerId, status: { in: ["PENDING", "ACCEPTED"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        note: true,
        createdAt: true,
        fromUser: { select: { name: true } },
        workspace: { select: { name: true } },
        page: { select: { title: true } },
        partner: { select: { name: true } },
      },
    }),
  ]);
  const waiting = intros.filter((i) => i.status === "PENDING");
  const working = intros.filter((i) => i.status === "ACCEPTED");
  const row = (i: (typeof intros)[number], urgent: boolean) => (
    <Link key={i.id} href="/network/connections" className="group">
      <Card className="flex items-center gap-4 px-5 py-4 transition-shadow group-hover:shadow-lift">
        <Avatar name={i.fromUser.name} size="lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2 text-base font-medium">
            {urgent && <NeedsDot />}
            <span className="truncate">
              {i.workspace?.name ?? i.fromUser.name}
              {i.page && <span className="font-normal text-fg-muted"> · {i.page.title}</span>}
            </span>
          </span>
          <span className="truncate text-sm text-fg-muted">
            {i.fromUser.name}
            {i.partner && !firm ? ` → ${i.partner.name}` : ""}: {i.note}
          </span>
        </span>
        <span className="shrink-0 text-xs text-fg-subtle">{timeAgo(i.createdAt)}</span>
      </Card>
    </Link>
  );
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-medium">Hello, {first}.</h1>
        <p className="text-md text-fg-muted">
          {waiting.length ? `${waiting.length} ${waiting.length === 1 ? "founder is" : "founders are"} waiting to hear from you.` : "No intros waiting. Founders find you from the steps in their plans."}
        </p>
      </div>
      {firm && (
        <Card className="flex flex-wrap items-center gap-4 px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-[12px] text-sm font-medium shadow-[inset_0_0_0_1.5px_var(--ring-link)]">
            {initials(firm.name)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-medium">{firm.name}</span>
            <span className="text-sm text-fg-muted">{firm.tagline}</span>
          </span>
          <LinkButton href={`/network/partners/${firm.slug}/edit` as Route} size="sm">
            Edit your profile
          </LinkButton>
        </Card>
      )}
      <section className="flex flex-col gap-3">
        <Eyebrow>Waiting for your answer</Eyebrow>
        {waiting.length ? waiting.map((i) => row(i, true)) : <p className="text-sm text-fg-subtle">Nothing waiting.</p>}
      </section>
      {working.length > 0 && (
        <section className="flex flex-col gap-3">
          <Eyebrow>Founders you work with</Eyebrow>
          {working.map((i) => row(i, false))}
        </section>
      )}
    </div>
  );
}
