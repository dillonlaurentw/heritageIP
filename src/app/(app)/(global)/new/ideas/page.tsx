import type { Metadata } from "next";
import { agentsLive } from "@/agents";
import { Screen } from "@/components/shell/Screen";
import { requireOnboarded } from "@/lib/session";
import { IdeaPicker } from "./IdeaPicker";

export const metadata: Metadata = { title: "Find an idea" };

export default async function IdeasPage() {
  const viewer = await requireOnboarded();
  const hasAnswers = Boolean(viewer.profile.beliefs || viewer.profile.strengths || viewer.profile.buildingToward);
  return (
    <Screen
      crumbs={[{ label: "Home", href: "/home" }, { label: "New workspace", href: "/new" }, { label: "Find an idea" }]}
      title="Find an idea worth your next few years"
      description="SELF suggests ideas from what you told it: what you believe, what you're good at, what you're building toward. Not from trends."
      width="narrow"
    >
      <IdeaPicker live={agentsLive()} hasAnswers={hasAnswers} />
    </Screen>
  );
}
