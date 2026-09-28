import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireOnboarded } from "@/lib/session";
import { getWorkspaceAccess } from "@/lib/workspaces";

export default async function TrashPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace } = await getWorkspaceAccess((await params).ws, viewer);
  return (
    <Screen crumbs={[{ label: workspace.name }, { label: "Trash" }]} title="Trash">
      <EmptyState title="Nothing in the trash." />
    </Screen>
  );
}
