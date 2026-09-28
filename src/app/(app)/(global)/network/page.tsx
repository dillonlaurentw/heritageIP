import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireOnboarded } from "@/lib/session";

export default async function Placeholder() {
  await requireOnboarded();
  return (
    <Screen crumbs={[{ label: "Network" }]} title="Network" description="Co-founders, mentors, partners and backers.">
      <EmptyState title="Arrives in Phase 7." />
    </Screen>
  );
}
