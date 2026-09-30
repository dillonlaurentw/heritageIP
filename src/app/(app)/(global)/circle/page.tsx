import type { Metadata } from "next";
import { MembersOnly } from "@/components/founder/MembersOnly";
import { Screen } from "@/components/shell/Screen";
import { loadCircle } from "@/lib/app/circles";
import { requireOnboarded } from "@/lib/session";
import { CircleClient } from "./CircleClient";

export const metadata: Metadata = { title: "Circle" };

/** Your circle on the web: the same quiet group chat as in the app. */
export default async function CirclePage() {
  const viewer = await requireOnboarded();
  if (viewer.profile.access !== "MEMBER")
    return (
      <Screen crumbs={[{ label: "Circle" }]} title="Circle" width="narrow">
        <MembersOnly />
      </Screen>
    );
  const circle = await loadCircle(viewer.user.id);
  if (!circle)
    return (
      <Screen crumbs={[{ label: "Circle" }]} title="Circle" description="You'll join a small group of founders like you once you've set up in the app." width="narrow">
        <span />
      </Screen>
    );
  return (
    <Screen crumbs={[{ label: "Circle" }]} title={circle.name} description={`${circle.members.map((m) => m.name.split(" ")[0]).join(", ")}. Founders building in the same place as you.`} width="narrow">
      <CircleClient circle={circle} me={viewer.user.id} />
    </Screen>
  );
}
