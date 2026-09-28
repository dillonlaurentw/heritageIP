import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireOnboarded } from "@/lib/session";

export default async function Placeholder() {
  await requireOnboarded();
  return (
    <Screen crumbs={[{ label: "Your agent" }]} title="Your agent" description="How your personal agent sees you.">
      <EmptyState title="Arrives in Phase 8." />
    </Screen>
  );
}
