import type { Metadata } from "next";
import type { Route } from "next";
import { agentsLive } from "@/agents";
import { Screen } from "@/components/shell/Screen";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/lib/db";
import { pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { readThesis } from "@/lib/thesis";
import { canEdit } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { PlanProposal } from "./PlanProposal";

export const metadata: Metadata = { title: "Game plan" };

export default async function PlanPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const [thesis, plan] = await Promise.all([
    readThesis(workspace.id),
    db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: workspace.id, systemKey: "gamePlan" } }, select: { id: true, archivedAt: true } }),
  ]);
  const planHref = plan && !plan.archivedAt ? pageHref(workspace.slug, plan.id) : null;

  return (
    <Screen
      crumbs={[
        { label: workspace.name, href: `/w/${workspace.slug}` as Route },
        ...(planHref ? [{ label: "Game plan", href: planHref }] : []),
        { label: "Plan with SELF" },
      ]}
      title="Plan with SELF"
      description="From the thesis to the steps between idea and launch, in four stages. Each step is tagged with who you need; tags lead straight to the right people."
      width="narrow"
    >
      {!thesis ? (
        <EmptyState
          title="Write the thesis first."
          hint="The game plan is built from it: who it's for, why now, and what you still need to prove."
          action={
            <LinkButton href={`/w/${workspace.slug}/thesis` as Route} variant="primary" size="md">
              Write the thesis
            </LinkButton>
          }
        />
      ) : (
        <PlanProposal workspaceId={workspace.id} live={agentsLive()} editable={canEdit(role)} planHref={planHref} />
      )}
    </Screen>
  );
}
