import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { AskForm } from "./AskForm";

export const metadata: Metadata = { title: "Ask SELF · SELF" };
export const maxDuration = 120;

export default async function AskPage() {
  const viewer = await requireOnboarded();
  const hubs = await db.hub.findMany({
    where: { OR: [{ ownerId: viewer.user.id }, { members: { some: { userId: viewer.user.id } } }] },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <Label tone="signal">Ask SELF</Label>
        <MaskedLines lines={["Ask SELF", "anything."]} className="type-display text-display" />
      </section>
      {hubs.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState line="SELF answers inside a hub. Start one." href="/hubs/new" />
        </div>
      ) : (
        <section className="border-t border-line px-edge pt-12 pb-32">
          <AskForm hubs={hubs} />
        </section>
      )}
    </PageWipe>
  );
}
