import type { Metadata } from "next";
import { MembersOnly } from "@/components/founder/MembersOnly";
import { Screen } from "@/components/shell/Screen";
import { mayHost } from "@/lib/app-rules";
import { hosting, opportunitiesFor } from "@/lib/app/opportunities";
import { requireOnboarded } from "@/lib/session";
import { OpportunitiesClient } from "./OpportunitiesClient";

export const metadata: Metadata = { title: "Opportunities" };

/** Dinners, trips and workshops that fit you, each with why; and what you host, if you host. */
export default async function OpportunitiesPage() {
  const viewer = await requireOnboarded();
  if (viewer.profile.access !== "MEMBER")
    return (
      <Screen crumbs={[{ label: "Opportunities" }]} title="Opportunities" width="narrow">
        <MembersOnly />
      </Screen>
    );
  const canHost = mayHost(viewer.profile.roles);
  const [mine, hosted] = await Promise.all([opportunitiesFor(viewer), canHost ? hosting(viewer) : Promise.resolve([])]);
  return (
    <Screen
      crumbs={[{ label: "Opportunities" }]}
      title="Opportunities"
      description="Hosted by mentors, partners and backers. You only see the ones that fit you, and why. Hosts pick for fit; nobody pays for a seat through SELF."
      width="narrow"
    >
      <OpportunitiesClient mine={mine} hosted={hosted} canHost={canHost} />
    </Screen>
  );
}
