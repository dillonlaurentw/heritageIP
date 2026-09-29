import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NotAnOffer } from "@/components/network/NotAnOffer";
import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { isBacker } from "@/lib/network";
import { FOCUS_AREAS } from "@/lib/profile-schema";
import { requireOnboarded } from "@/lib/session";
import { WORKSPACE_STAGE } from "@/lib/stages";

export const metadata: Metadata = { title: "Backers" };


/** For backers: companies open to backers. Interest only. No amounts, valuations or terms, anywhere. */
export default async function BackersPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const viewer = await requireOnboarded();
  if (!isBacker(viewer)) redirect("/network/funding");
  const { s } = await searchParams;
  const sector = FOCUS_AREAS.find((a) => a === s);
  const list = await db.workspace.findMany({
    where: { kind: "TEAM", discoverable: true, ...(sector ? { sector } : {}) },
    orderBy: [{ featured: "desc" }, { discoverableAt: "desc" }],
    select: { slug: true, name: true, oneLiner: true, sector: true, stage: true, backerAsk: true, _count: { select: { members: true } } },
  });

  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Backers" }]}
      title="Companies open to backers"
      description="Signal interest; if the founder says yes, you both get each other's details. Everything after that happens between you, off SELF."
    >
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link href="/network/backers" className={`rounded-md px-2.5 py-1 text-sm ${!sector ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover"}`}>
          All
        </Link>
        {FOCUS_AREAS.slice(0, 11).map((a) => (
          <Link
            key={a}
            href={`/network/backers?s=${encodeURIComponent(a)}` as Route}
            className={`rounded-md px-2.5 py-1 text-sm ${sector === a ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover"}`}
          >
            {a}
          </Link>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="No companies open in this area yet." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {list.map((w) => (
            <li key={w.slug}>
              <Link href={`/network/backers/${w.slug}` as Route} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 py-3 hover:bg-bg-hover">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium">{w.name}</p>
                  <p className="truncate text-sm text-fg-muted">{w.oneLiner}</p>
                </div>
                {w.sector && <Tag>{w.sector}</Tag>}
                <Tag color="blue">{WORKSPACE_STAGE[w.stage] ?? w.stage}</Tag>
                <span className="text-xs text-fg-subtle">{w._count.members} people</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NotAnOffer />
    </Screen>
  );
}
