import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Screen } from "@/components/shell/Screen";
import { openConversation } from "@/lib/messages";
import { requireOnboarded } from "@/lib/session";

/** Opens (or creates) the conversation with someone, if you're allowed to message them. */
export default async function MessageWith({ params }: { params: Promise<{ userId: string }> }) {
  const viewer = await requireOnboarded();
  const res = await openConversation(viewer, (await params).userId);
  if (res.ok) redirect(`/messages/${res.id}` as Route);
  return (
    <Screen crumbs={[{ label: "Messages", href: "/messages" }]} title="Not yet" description={res.message} width="narrow">
      <Link href="/network/connections" className="text-sm font-medium underline underline-offset-2">
        Go to your connections
      </Link>
    </Screen>
  );
}
