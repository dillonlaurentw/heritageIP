import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireOnboarded } from "@/lib/session";

export default async function Placeholder() {
  await requireOnboarded();
  return (
    <Screen crumbs={[{ label: "Admin" }]} title="Admin" description="The SELF control room.">
      <EmptyState title="Arrives in Phase 10." />
    </Screen>
  );
}
