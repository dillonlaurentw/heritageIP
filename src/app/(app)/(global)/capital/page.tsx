import type { Metadata } from "next";
import { MembersOnly } from "@/components/founder/MembersOnly";
import { NotAnOffer } from "@/components/network/NotAnOffer";
import { Screen } from "@/components/shell/Screen";
import { foundersForBacker, isBacker, myCapital } from "@/lib/app/capital";
import { requireOnboarded } from "@/lib/session";
import { BackerList, FounderCapital } from "./CapitalClient";

export const metadata: Metadata = { title: "Capital" };

/** Interest only: founders share updates with backers when they choose; backers follow and say they're interested. */
export default async function CapitalPage() {
  const viewer = await requireOnboarded();
  if (viewer.profile.access !== "MEMBER")
    return (
      <Screen crumbs={[{ label: "Capital" }]} title="Capital" width="narrow">
        <MembersOnly />
      </Screen>
    );
  const backer = isBacker(viewer);
  const [mine, founders] = await Promise.all([myCapital(viewer), backer ? foundersForBacker(viewer) : Promise.resolve(null)]);
  return (
    <Screen
      crumbs={[{ label: "Capital" }]}
      title="Capital"
      description={backer ? "Founders sharing their progress with backers. Follow their updates, and tell them if you're interested. A yes opens a conversation." : "Share short updates with backers on SELF when you choose. Never your journal, never amounts or terms."}
      width="narrow"
    >
      <div className="flex flex-col gap-10">
        {backer && founders ? <BackerList founders={founders} /> : <FounderCapital data={mine} />}
        <p className="text-sm text-fg-muted">Investing through SELF isn&apos;t available: it needs a licensed partner and securities lawyers first. Anything about money happens between you, off SELF.</p>
        <NotAnOffer />
      </div>
    </Screen>
  );
}
