import { ArrowRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Ring } from "@/components/ring/Ring";
import { Topbar } from "@/components/shell/Topbar";
import { AgentMark } from "@/components/ui/AgentMark";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { Card, Eyebrow, NeedsDot } from "@/components/ui/Card";
import { PageIcon, WorkspaceMark } from "@/components/ui/PageIcon";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { needsYou, type NeedsYouItem } from "@/lib/needs-you";
import { pageHref, searchPages } from "@/lib/pages";
import type { RingNode } from "@/lib/ring";
import { loadRing, themeLinks } from "@/lib/ring-data";
import { requireOnboarded } from "@/lib/session";
import { canEdit, ROLE_LABEL } from "@/lib/workspace-rules";
import { lastWorkspaceSlug, listWorkspaces } from "@/lib/workspaces";
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
  const [{ ws, as }, workspaces, invites, recent] = await Promise.all([
    searchParams,
    listWorkspaces(viewer.user.id),
    db.invite.findMany({
      where: { email: viewer.user.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
      include: { workspace: { select: { name: true, icon: true } }, invitedBy: { select: { name: true } } },
    }),
    searchPages(viewer, ""),
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

  return (
    <>
      <Topbar crumbs={[{ label: "You" }]} actions={hatNav} />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-x-16 gap-y-10 px-6 pt-4 pb-24 md:px-12 xl:grid-cols-[auto_1fr]">
        <section aria-label="Your ring" className="flex flex-col items-center gap-5 xl:sticky xl:top-20">
          {workspaces.length > 1 && (
            <nav aria-label="Companies" className="flex flex-wrap justify-center gap-1.5">
              {workspaces.map((w) => (
                <Link
                  key={w.slug}
                  href={`/home?ws=${w.slug}` as Route}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm",
                    w.slug === current?.slug ? "bg-surface font-medium text-fg shadow-card" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {w.name}
                </Link>
              ))}
            </nav>
          )}
          {current ? (
            <>
              <div className="hidden sm:block">
                <Ring nodes={ring} size={440} themeHref={themeLinks(current.slug)} />
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
              <Ring nodes={[]} size={440} />
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-title font-medium">
              {greeting()}, {first}.
            </h1>
            <p className="text-md text-fg-muted">
              {current
                ? items.length > 0
                  ? "Here's what needs you today."
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

          {!current ? (
            <Card lift className="flex flex-col items-start gap-5 p-10">
              <h2 className="text-2xl font-medium">What are you building?</h2>
              <p className="max-w-lg text-md text-fg-muted">
                Half-formed is fine. Say it the way you&apos;d tell a friend. SELF asks a few questions, drafts a thesis, then
                finds the people it needs.
              </p>
              <LinkButton href="/new" variant="primary" size="lg">
                Start with an idea
              </LinkButton>
            </Card>
          ) : (
            items.length > 0 && (
              <div className="flex flex-col gap-3">
                {items.map((it) => (
                  <NeedsYouCard key={it.id} item={it} />
                ))}
              </div>
            )
          )}

          {workspaces.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Eyebrow>Your companies</Eyebrow>
                <LinkButton href="/new" variant="ghost" size="xs">
                  <Plus className="size-3.5" /> New
                </LinkButton>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {workspaces.map((w) => (
                  <Link key={w.id} href={`/w/${w.slug}` as Route} className="group">
                    <Card className="flex h-full items-start gap-3 p-4 transition-shadow group-hover:shadow-lift">
                      <WorkspaceMark name={w.name} icon={w.icon} size="md" />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-base font-medium">{w.name}</span>
                        <span className="line-clamp-2 text-sm text-fg-muted">{w.oneLiner || "No one-liner yet."}</span>
                        <span className="text-xs text-fg-subtle">
                          {ROLE_LABEL[w.role]} · {w.memberCount} {w.memberCount === 1 ? "person" : "people"}
                        </span>
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div className="flex flex-col gap-3">
              <Eyebrow>Where you left off</Eyebrow>
              <Card className="divide-y divide-border overflow-hidden">
                {recent.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    href={pageHref(p.workspace.slug, p.id) as Route}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover"
                  >
                    <PageIcon icon={p.icon} />
                    <span className="min-w-0 flex-1 truncate text-base">{p.title || "Untitled"}</span>
                    <span className="truncate text-xs text-fg-subtle">{p.workspace.kind === "PERSONAL" ? "Private" : p.workspace.name}</span>
                  </Link>
                ))}
              </Card>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function NeedsYouCard({ item }: { item: NeedsYouItem }) {
  return (
    <Link href={item.href as Route} className="group">
      <Card className="flex items-center gap-4 px-5 py-4 transition-shadow group-hover:shadow-lift">
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
          <span className="flex items-center gap-2 text-base font-medium">
            {item.urgent && <NeedsDot />}
            <span className="truncate">{item.title}</span>
          </span>
          <span className="truncate text-sm text-fg-muted">{item.detail}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}
