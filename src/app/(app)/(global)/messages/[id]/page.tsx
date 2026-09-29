import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { Thread } from "@/components/messages/Thread";
import { Topbar } from "@/components/shell/Topbar";
import { listConversations, loadThread, trialOptions } from "@/lib/messages";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Messages" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireOnboarded();
  const { id } = await params;
  const thread = await loadThread(viewer, id);
  if (!thread) notFound();
  const [items, options] = await Promise.all([
    listConversations(viewer.user.id),
    thread.other ? trialOptions(viewer.user.id, thread.other.id) : [],
  ]);
  const other = thread.other ? { id: thread.other.id, name: thread.other.name, headline: thread.other.profile?.headline ?? null } : null;
  return (
    <>
      <Topbar crumbs={[{ label: "Messages", href: "/messages" }, { label: other?.name ?? "Conversation" }]} />
      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 pb-6 md:grid-cols-[20rem_1fr] md:px-8">
        <aside className="hidden flex-col gap-3 md:flex">
          <ConversationList items={items} current={id} />
        </aside>
        <section className="flex h-[calc(100dvh-5.5rem)] min-h-0 flex-col overflow-hidden rounded-2xl bg-bg-subtle">
          <Thread
            conversationId={id}
            me={{ id: viewer.user.id, name: viewer.user.name, headline: null }}
            other={other}
            about={thread.conv.workspace ? { name: thread.conv.workspace.name, slug: thread.conv.workspace.slug } : null}
            initial={thread.messages.map((m) => ({ id: m.id, authorId: m.authorId, kind: m.kind, text: m.text, data: m.data, at: m.createdAt.toISOString() }))}
            trialOptions={options}
            rehearseHref={other ? `/simulations/new?with=${other.id}` : null}
          />
        </section>
      </div>
    </>
  );
}
