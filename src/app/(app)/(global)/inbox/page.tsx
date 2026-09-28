import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireOnboarded } from "@/lib/session";

export default async function Placeholder() {
  await requireOnboarded();
  return (
    <Screen crumbs={[{ label: "Inbox" }]} title="Inbox" description="Mentions, comments and requests land here.">
      <EmptyState title="Arrives in Phase 9." />
    </Screen>
  );
}
