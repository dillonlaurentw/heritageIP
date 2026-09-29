import type { Metadata, Route } from "next";
import Link from "next/link";
import { NotAnOffer } from "@/components/network/NotAnOffer";
import { Screen } from "@/components/shell/Screen";
import { db } from "@/lib/db";
import { FOCUS_AREAS } from "@/lib/profile-schema";
import { requireOnboarded } from "@/lib/session";
import { readThesis } from "@/lib/thesis";
import { canManage } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { DiscoveryPanel } from "./DiscoveryPanel";

export const metadata: Metadata = { title: "Backers" };

/** A company's backer settings: open to backers or not, sector, what you're looking for. Interest only. */
export default async function WorkspaceBackersPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const ws = await db.workspace.findUniqueOrThrow({ where: { id: workspace.id }, select: { discoverable: true, sector: true, backerAsk: true } });
  const [thesis, interest] = await Promise.all([
    readThesis(workspace.id),
    db.signal.groupBy({ by: ["status"], where: { kind: "BACKER_INTEREST", workspaceId: workspace.id }, _count: true }),
  ]);
  const count = (s: string) => interest.find((i) => i.status === s)?._count ?? 0;

  return (
    <Screen
      crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` }, { label: "Backers" }]}
      title="Backers"
      description="Open your company to backers on SELF. They see a short teaser (name, one-liner, stage, sector, thesis, team names, plan progress and what you're looking for) and can signal interest. If you say yes, you both get each other's details. No money moves on SELF."
      width="narrow"
    >
      <DiscoveryPanel
        workspaceId={workspace.id}
        slug={workspace.slug}
        initial={{ discoverable: ws.discoverable, sector: (FOCUS_AREAS as readonly string[]).includes(ws.sector ?? "") ? (ws.sector as (typeof FOCUS_AREAS)[number]) : null, backerAsk: ws.backerAsk ?? "" }}
        hasThesis={Boolean(thesis)}
        editable={canManage(role)}
        sectors={[...FOCUS_AREAS]}
      />
      <p className="mt-8 text-sm text-fg-muted">
        {count("PENDING")} waiting · {count("ACCEPTED")} connected.{" "}
        <Link href={"/network/connections" as Route} className="text-fg underline underline-offset-2">
          Answer in Connections
        </Link>
      </p>
      <NotAnOffer />
    </Screen>
  );
}
