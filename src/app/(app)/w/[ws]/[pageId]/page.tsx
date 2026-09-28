import { Screen } from "@/components/shell/Screen";
import { getPageAccess } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";

export default async function PageView({ params }: { params: Promise<{ ws: string; pageId: string }> }) {
  const viewer = await requireOnboarded();
  const { ws, pageId } = await params;
  const { page } = await getPageAccess(ws, pageId, viewer);
  return (
    <Screen crumbs={[{ label: page.workspace.name }, { label: page.title, icon: page.icon }]} title={page.title || "Untitled"} width="narrow">
      <p className="text-md whitespace-pre-wrap text-fg-muted">{page.text}</p>
    </Screen>
  );
}
