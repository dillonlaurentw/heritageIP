import type { Metadata } from "next";
import type { Route } from "next";
import { Screen } from "@/components/shell/Screen";
import { requireOnboarded } from "@/lib/session";
import { TEMPLATES } from "@/lib/templates";
import { canEdit } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { TemplateGrid } from "./TemplateGrid";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  return (
    <Screen
      crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` as Route }, { label: "Templates" }]}
      title="Templates"
      description="Start from a shape that works: thinking, planning, running the business, and working as a team."
    >
      <TemplateGrid
        workspaceId={workspace.id}
        editable={canEdit(role)}
        templates={TEMPLATES.map((t) => ({ key: t.key, title: t.title, icon: t.icon, blurb: t.blurb, group: t.group, kind: t.kind }))}
      />
    </Screen>
  );
}
