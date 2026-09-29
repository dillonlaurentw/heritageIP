import type { Metadata } from "next";
import { ConversationList } from "@/components/messages/ConversationList";
import { Topbar } from "@/components/shell/Topbar";
import { listConversations } from "@/lib/messages";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const viewer = await requireOnboarded();
  const items = await listConversations(viewer.user.id);
  return (
    <>
      <Topbar crumbs={[{ label: "Messages" }]} />
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 pb-10 md:grid-cols-[20rem_1fr] md:px-8">
        <aside className="flex flex-col gap-3">
          <h1 className="px-3 text-2xl font-medium">Messages</h1>
          <ConversationList items={items} />
        </aside>
        <div className="hidden items-center justify-center rounded-2xl bg-surface/50 text-sm text-fg-subtle md:flex">
          {items.length ? "Pick a conversation." : "Conversations with your team and people who said yes show up here."}
        </div>
      </div>
    </>
  );
}
