import type { Metadata } from "next";
import type { Route } from "next";
import { agentsLive } from "@/agents";
import { FlowSteps } from "@/components/flow/FlowSteps";
import { Topbar } from "@/components/shell/Topbar";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { pageHref } from "@/lib/pages";
import { loadRing } from "@/lib/ring-data";
import { requireOnboarded } from "@/lib/session";
import { readThesis } from "@/lib/thesis";
import { canEdit } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { PlanProposal } from "./PlanProposal";

export const metadata: Metadata = { title: "Plan" };

export default async function PlanPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  const [thesis, plan, baseRing] = await Promise.all([
    readThesis(workspace.id),
    db.page.findUnique({ where: { workspaceId_systemKey: { workspaceId: workspace.id, systemKey: "gamePlan" } }, select: { id: true, archivedAt: true } }),
    loadRing(workspace, viewer.user.id, { planChairs: false }),
  ]);
  const planHref = plan && !plan.archivedAt ? pageHref(workspace.slug, plan.id) : null;

  return (
    <>
      <Topbar
        crumbs={[
          { label: workspace.name, href: `/w/${workspace.slug}` as Route },
          ...(planHref ? [{ label: "Game plan", href: planHref }] : []),
          { label: "Plan with SELF" },
        ]}
      />
      <div className="mx-auto w-full max-w-7xl px-6 pt-6 pb-24 md:px-12">
        {!thesis ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-7">
            <FlowSteps current="Plan" />
            <Card lift className="flex flex-col items-start gap-4 p-10">
              <h1 className="text-2xl font-medium">The thesis comes first.</h1>
              <p className="text-md text-fg-muted">The plan is built from it: who it&apos;s for, why now, and what you still need to prove.</p>
              <LinkButton href={`/w/${workspace.slug}/thesis` as Route} variant="primary" size="lg">
                Write the thesis
              </LinkButton>
            </Card>
          </div>
        ) : (
          <PlanProposal
            workspace={{ id: workspace.id, slug: workspace.slug }}
            live={agentsLive()}
            editable={canEdit(role)}
            planHref={planHref}
            baseRing={baseRing}
          />
        )}
      </div>
    </>
  );
}
