import type { Metadata } from "next";
import { Screen } from "@/components/shell/Screen";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireOnboarded } from "@/lib/session";
import { atLeast } from "@/lib/workspace-rules";
import { lastWorkspaceSlug, listWorkspaces } from "@/lib/workspaces";
import { AskForm } from "./AskForm";

export const metadata: Metadata = { title: "Ask SELF" };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string; ws?: string }> }) {
  const viewer = await requireOnboarded();
  const { q, ws } = await searchParams;
  const workspaces = (await listWorkspaces(viewer.user.id)).filter((w) => atLeast(w.role, "MEMBER"));
  const current = ws && workspaces.some((w) => w.slug === ws) ? ws : await lastWorkspaceSlug(viewer.user.id);

  return (
    <Screen
      crumbs={[{ label: "Ask SELF" }]}
      title="Ask SELF anything"
      description="SELF picks the right agent (strategy, go-to-market, operations, fundraising prep or the legal explainer) and answers with your company in mind."
      width="narrow"
    >
      {workspaces.length === 0 ? (
        <EmptyState
          title="Start a company first."
          hint="SELF's agents answer with your company's thesis, plan and team in mind."
          action={<LinkButton href="/new" variant="primary">New workspace</LinkButton>}
        />
      ) : (
        <AskForm
          workspaces={workspaces.map((w) => ({ id: w.id, slug: w.slug, name: w.name }))}
          current={workspaces.some((w) => w.slug === current) ? current! : workspaces[0].slug}
          question={q?.slice(0, 2000) ?? ""}
        />
      )}
    </Screen>
  );
}
