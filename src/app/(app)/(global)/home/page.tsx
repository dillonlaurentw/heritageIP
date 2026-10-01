import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Ring } from "@/components/ring/Ring";
import { Topbar } from "@/components/shell/Topbar";
import { AgentMark } from "@/components/ui/AgentMark";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { Card, Eyebrow, NeedsDot } from "@/components/ui/Card";
import { WorkspaceMark } from "@/components/ui/PageIcon";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { needsYou, type NeedsYouItem } from "@/lib/needs-you";
import type { RingNode } from "@/lib/ring";
import { loadRing, themeLinks } from "@/lib/ring-data";
import { requireOnboarded } from "@/lib/session";
import { canEdit, ROLE_LABEL } from "@/lib/workspace-rules";
import { lastWorkspaceSlug, listWorkspaces } from "@/lib/workspaces";
import { loadJournal } from "@/lib/app/journal";
import { circleOf } from "@/lib/app/circles";
import { JournalClient } from "../journal/JournalClient";
import { AcceptInviteButton } from "./AcceptInviteButton";
import { BackerHome, PartnerHome } from "./OtherHomes";

export const metadata: Metadata = { title: "You" };

const greeting = () => {
  const h = new Date().getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/** "You": your ring for the company you're working on, and what needs you. */
export default async function HomePage({ searchParams }: { searchParams: Promise<{ ws?: string; as?: string }> }) {
  const viewer = await requireOnboarded();
  const [{ ws, as }, workspaces, invites] = await Promise.all([
    searchParams,
    listWorkspaces(viewer.user.id),
    db.invite.findMany({
      where: { email: viewer.user.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { workspace: { select: { name: true, icon: true } }, invitedBy: { select: { name: true } } },
    }),
  ]);
  // One account, many hats: founders see their ring; backers and partners get their own home.
  const roles = viewer.profile.roles;
  const hats = [
    ...(roles.includes("BUILDER") || workspaces.length ? (["founder"] as const) : []),
    ...(roles.includes("BACKER") ? (["backer"] as const) : []),
    ...(roles.includes("PARTNER") ? (["partner"] as const) : []),
  ];
  const hat = hats.find((h) => h === as) ?? (workspaces.length ? "founder" : (hats[0] ?? "founder"));
  const first = viewer.user.name.split(" ")[0];
  const hatNav =
    hats.length > 1 ? (
      <nav aria-label="Which hat" className="flex gap-1.5">
        {hats.map((h) => (
          <Link
            key={h}
            href={`/home?as=${h}` as Route}
            className={cn("rounded-full px-3 py-1 text-sm", h === hat ? "bg-surface font-medium shadow-card" : "text-fg-muted hover:text-fg")}
          >
            As a {h}
          </Link>
        ))}
      </nav>
    ) : undefined;
  if (hat !== "founder") {
    return (
      <>
        <Topbar crumbs={[{ label: "You" }]} actions={hatNav} />
        <div className="mx-auto w-full max-w-4xl px-6 pt-4 pb-24 md:px-12">
          {hat === "backer" ? <BackerHome viewerId={viewer.user.id} first={first} /> : <PartnerHome viewerId={viewer.user.id} first={first} />}
        </div>
      </>
    );
  }

  const slug = ws && workspaces.some((w) => w.slug === ws) ? ws : await lastWorkspaceSlug(viewer.user.id);
  const current = workspaces.find((w) => w.slug === slug) ?? null;
  const ring: RingNode[] = current ? await loadRing(current, viewer.user.id) : [];
  const items = await needsYou(
    viewer.user.id,
    current ? { id: current.id, slug: current.slug, name: current.name, canEdit: canEdit(current.role) } : null,
    ring,
  );

  // Today: the journal first, then the one or two things that move the company, then the ring.
  const member = viewer.profile.access === "MEMBER";
  const [journal, circle] = member ? await Promise.all([loadJournal(viewer.user.id), circleOf(viewer.user.id)]) : [null, null];
  const [next, ...rest] = items;

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-x-16 gap-y-12 px-6 pt-12 pb-24 md:px-12 lg:grid-cols-[1fr_auto]">
      <section className="flex min-w-0 flex-col gap-10">
        <div className="flex flex-col gap-3">
          {hatNav}
          <h1 className="text-title md:text-[4.25rem]">
            {greeting()}, {first}.
          </h1>
          <p className="text-lg text-fg-muted">
            {current
              ? items.length > 0
                ? "One thing at a time. Here's what moves things today."
                : "Nothing is waiting on you. A good day to build."
              : "Everything starts with what you want to build."}
          </p>
        </div>

        {invites.length > 0 && (
          <div className="flex flex-col gap-2">
            {invites.map((i) => (
              <Card key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <NeedsDot />
                <p className="min-w-0 flex-1 text-base">
                  <span className="font-medium">{i.invitedBy.name}</span> invited you to{" "}
                  <span className="font-medium">{i.workspace.name}</span> as {ROLE_LABEL[i.role].toLowerCase()}.
                </p>
                <AcceptInviteButton token={i.token} />
              </Card>
            ))}
          </div>
        )}

        {!current && (
          <Card lift className="flex flex-col items-start gap-5 p-10">
            <h2 className="text-3xl">What are you building?</h2>
            <p className="max-w-lg text-md text-fg-muted">
              Half-formed is fine. Say it the way you&apos;d tell a friend. SELF drafts a thesis and shows who you&apos;ll need.
            </p>
            <LinkButton href="/new" variant="primary" size="lg">
              Start with an idea
            </LinkButton>
          </Card>
        )}

        {next && (
          <div className="flex flex-col gap-3">
            <Eyebrow>Next for you</Eyebrow>
            <NeedsYouCard item={next} big />
            {rest.slice(0, 2).map((it) => (
              <NeedsYouCard key={it.id} item={it} />
            ))}
          </div>
        )}

        {journal && (
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <Eyebrow>Your journal · only you can read it</Eyebrow>
              <Link href="/journal" className="text-sm text-fg-muted hover:text-fg">
                Earlier days
              </Link>
            </div>
            <JournalClient journal={{ today: journal.today, earlier: [] }} hasCircle={!!circle} />
          </div>
        )}
      </section>

      <aside aria-label="Your ring" className="flex flex-col items-center gap-4 lg:sticky lg:top-8">
        {current ? (
          <>
            <div className="hidden sm:block">
              <Ring nodes={ring} size={380} themeHref={themeLinks(current.slug)} />
            </div>
            <div className="sm:hidden">
              <Ring nodes={ring} size={290} labels={false} />
            </div>
            <Link href={`/w/${current.slug}` as Route} className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
              <WorkspaceMark name={current.name} icon={current.icon} /> {current.name} <ArrowRight className="size-3.5" />
            </Link>
          </>
        ) : (
          <div className="hidden sm:block">
            <Ring nodes={[]} size={380} />
          </div>
        )}
      </aside>
    </div>
  );
}

function NeedsYouCard({ item, big }: { item: NeedsYouItem; big?: boolean }) {
  return (
    <Link href={item.href as Route} className="group">
      <Card lift={big} className={cn("flex items-center gap-4 transition-shadow group-hover:shadow-lift", big ? "px-7 py-6" : "px-5 py-4")}>
        {item.who.kind === "person" ? (
          <Avatar name={item.who.name} size="lg" />
        ) : item.who.kind === "agent" ? (
          <AgentMark mark={item.who.mark ?? item.who.name} />
        ) : (
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-accent text-accent">
            +
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn("flex items-center gap-2 font-medium", big ? "text-lg" : "text-base")}>
            {item.urgent && <NeedsDot />}
            <span className={big ? "line-clamp-2" : "truncate"}>{item.title}</span>
          </span>
          <span className={cn("text-sm text-fg-muted", big ? "line-clamp-2" : "truncate")}>{item.detail}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}
