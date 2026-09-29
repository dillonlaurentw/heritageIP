import { ArrowRight, Handshake, Inbox, Lightbulb, Scale, Sprout, Users } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Screen } from "@/components/shell/Screen";
import { db } from "@/lib/db";
import { isBacker, pendingIncoming } from "@/lib/network";
import { CATEGORY_COPY, PARTNER_CATEGORIES } from "@/lib/partner-categories";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Network" };

function Door({ href, icon, title, line, meta }: { href: string; icon: ReactNode; title: string; line: string; meta?: string }) {
  return (
    <Link href={href as Route} className="group flex flex-col gap-2 rounded-xl bg-surface shadow-card p-4 hover:border-border-strong hover:bg-bg-hover">
      <span className="flex items-center gap-2 text-md font-semibold">
        <span className="text-fg-muted [&>svg]:size-4">{icon}</span>
        {title}
        <ArrowRight className="ml-auto size-4 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span className="text-sm text-fg-muted">{line}</span>
      {meta && <span className="mt-auto text-xs text-fg-subtle">{meta}</span>}
    </Link>
  );
}

/** Find your people: co-founders, mentors, partners, backers. Every door ends in a Signal. */
export default async function NetworkPage() {
  const viewer = await requireOnboarded();
  const [roles, mentors, partners, pending] = await Promise.all([
    db.page.count({ where: { kind: "ROW", archivedAt: null, parent: { systemKey: "roles" }, workspace: { kind: "TEAM" }, props: { path: ["posted"], equals: true } } }),
    db.profile.count({ where: { roles: { has: "MENTOR" }, mentorOpen: true } }),
    db.partner.groupBy({ by: ["featured"], _count: true }),
    pendingIncoming(viewer.user.id),
  ]);
  const partnerCount = partners.reduce((n, g) => n + g._count, 0);

  return (
    <Screen
      crumbs={[{ label: "Network" }]}
      title="Find your people"
      description="Co-founders and teammates, mentors, the partners who make and sell things, and backers. Ask, they answer; when it's a yes, you both get each other's details."
      headerActions={
        <Link href="/network/connections" className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-bg-hover">
          <Inbox className="size-4" /> Connections
          {pending > 0 && <span className="rounded-sm bg-accent px-1 text-2xs font-semibold text-accent-fg">{pending}</span>}
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Door href="/network/roles" icon={<Users />} title="Co-founders & teammates" line="Roles other builders are hiring for. Say you're interested, or post your own." meta={`${roles} open ${roles === 1 ? "role" : "roles"}`} />
        <Door href="/network/mentors" icon={<Lightbulb />} title="Mentors" line="People who've done it, one request away." meta={`${mentors} taking requests`} />
        <Door
          href="/network/partners"
          icon={<Handshake />}
          title="Partners"
          line="Manufacturing, legal, marketing, website & build, design, finance and go-to-market."
          meta={`${partnerCount} firms`}
        />
        <Door
          href={isBacker(viewer) ? "/network/backers" : "/network/funding"}
          icon={<Sprout />}
          title="Funding"
          line={isBacker(viewer) ? "Companies open to backers. Interest and introductions only." : "Open your company to backers. Interest and introductions only; no money moves on SELF."}
        />
      </div>

      <h2 className="mt-10 mb-3 text-sm font-medium text-fg-muted">Partners by what you need</h2>
      <div className="flex flex-wrap gap-2">
        {PARTNER_CATEGORIES.filter((c) => c !== "OTHER").map((c) => (
          <Link
            key={c}
            href={`/network/partners?c=${CATEGORY_COPY[c].slug}` as Route}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-bg-hover"
          >
            {c === "LEGAL" && <Scale className="size-3.5 text-fg-muted" />}
            {CATEGORY_COPY[c].label}
          </Link>
        ))}
      </div>
    </Screen>
  );
}
