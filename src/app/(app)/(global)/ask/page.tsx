import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireOnboarded } from "@/lib/session";

export default async function Placeholder() {
  await requireOnboarded();
  return (
    <Screen crumbs={[{ label: "Ask SELF" }]} title="Ask SELF" description="Ask anything about your company.">
      <EmptyState title="Arrives in Phase 5." />
    </Screen>
  );
}
