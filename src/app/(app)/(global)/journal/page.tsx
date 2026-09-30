import type { Metadata } from "next";
import { MembersOnly } from "@/components/founder/MembersOnly";
import { Screen } from "@/components/shell/Screen";
import { loadJournal } from "@/lib/app/journal";
import { circleOf } from "@/lib/app/circles";
import { requireOnboarded } from "@/lib/session";
import { JournalClient } from "./JournalClient";

export const metadata: Metadata = { title: "Journal" };

/** Your private journal on the web: the same one as in the app. Only you can read it. */
export default async function JournalPage() {
  const viewer = await requireOnboarded();
  if (viewer.profile.access !== "MEMBER")
    return (
      <Screen crumbs={[{ label: "Journal" }]} title="Journal" width="narrow">
        <MembersOnly />
      </Screen>
    );
  const [journal, circle] = await Promise.all([loadJournal(viewer.user.id), circleOf(viewer.user.id)]);
  return (
    <Screen crumbs={[{ label: "Journal" }]} title="Journal" description="What happened today? SELF answers with one good question. Only you can read this." width="narrow">
      <JournalClient journal={journal} hasCircle={!!circle} />
    </Screen>
  );
}
