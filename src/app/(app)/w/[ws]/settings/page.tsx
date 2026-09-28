import type { Metadata } from "next";
import type { Route } from "next";
import { Screen } from "@/components/shell/Screen";
import { requireOnboarded } from "@/lib/session";
import { canManage } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace, role } = await getWorkspaceAccess((await params).ws, viewer);
  return (
    <Screen
      crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` as Route }, { label: "Settings" }]}
      title="Settings"
      description={canManage(role) ? "Name, look and the workspace's lifecycle." : "Only owners and admins can change settings."}
      width="narrow"
    >
      <SettingsForm
        workspace={{ id: workspace.id, name: workspace.name, oneLiner: workspace.oneLiner ?? "", icon: workspace.icon ?? "" }}
        canManage={canManage(role)}
        isOwner={role === "OWNER"}
        userId={viewer.user.id}
      />
    </Screen>
  );
}
