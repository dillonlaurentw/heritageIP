import type { Metadata, Route } from "next";
import Link from "next/link";
import { NotAnOffer } from "@/components/network/NotAnOffer";
import { Screen } from "@/components/shell/Screen";
import { Tag } from "@/components/ui/Tag";
import { requireOnboarded } from "@/lib/session";
import { listWorkspaces } from "@/lib/workspaces";

export const metadata: Metadata = { title: "Funding" };

/** For builders: how funding works on SELF, and a way into each company's backer settings. */
export default async function FundingPage() {
  const viewer = await requireOnboarded();
  const workspaces = (await listWorkspaces(viewer.user.id)).filter((w) => w.role === "OWNER" || w.role === "ADMIN");
  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Funding" }]}
      title="Funding"
      description="Open a company to backers on SELF. They read a short teaser and can signal interest; if you say yes, you both get each other's details. That's all: no money moves on SELF, and there are no amounts or terms here."
      width="narrow"
    >
      {workspaces.length === 0 ? (
        <p className="text-sm text-fg-muted">Only a company&apos;s owners and admins can open it to backers.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {workspaces.map((w) => (
            <li key={w.slug}>
              <Link href={`/w/${w.slug}/backers` as Route} className="flex items-center gap-3 px-2 py-3 hover:bg-bg-hover">
                <span className="min-w-0 flex-1 text-base font-medium">{w.name}</span>
                <Tag>Backer settings</Tag>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NotAnOffer />
    </Screen>
  );
}
