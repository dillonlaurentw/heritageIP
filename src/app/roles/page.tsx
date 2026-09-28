import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { coverTileTone } from "@/components/mosaic/CoverArt";
import { HubCover } from "@/components/mosaic/HubCover";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile, type TileSpan } from "@/components/mosaic/Tile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label, Tag } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { hubNumber } from "@/lib/hubs";
import { COMMITMENTS } from "@/lib/role-schema";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Open roles · SELF" };

const RHYTHM: TileSpan[] = ["wide", "square", "square", "square", "square", "half", "half"];

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const viewer = await requireOnboarded();
  const { c } = await searchParams;
  const commitment = COMMITMENTS.find((x) => x === c);

  const roles = await db.roleOpening.findMany({
    where: { status: "OPEN", hub: { ownerId: { not: viewer.user.id } }, ...(commitment && { commitment }) },
    orderBy: { createdAt: "desc" },
    include: {
      hub: { select: { name: true, number: true, coverLayout: true, coverTone: true, coverImageUrl: true } },
      signals: { where: { fromUserId: viewer.user.id, status: { in: ["PENDING", "ACCEPTED"] } }, select: { status: true } },
    },
  });

  const filter = (label: string, value?: string) => {
    const on = (value ?? undefined) === commitment;
    return (
      <Link
        key={label}
        href={(value ? `/roles?c=${encodeURIComponent(value)}` : "/roles") as Route}
        className={`rounded-xs border px-3 py-2 text-small font-medium transition-colors ${on ? "border-bone bg-bone text-field" : "border-line hover:border-smoke"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-10">
        <div className="flex justify-between">
          <Label>Open roles</Label>
          <Label>{String(roles.length).padStart(2, "0")} open</Label>
        </div>
        <MaskedLines lines={["Join something", "worth building."]} className="type-display text-display" />
        <p className="measure text-lead text-smoke">
          Builders on SELF looking for co-founders and early teammates. Signal interest; if they say yes, you both get
          each other&apos;s details.
        </p>
        <div className="flex flex-wrap gap-2">
          {filter("All")}
          {COMMITMENTS.map((x) => filter(x, x))}
        </div>
      </section>

      {roles.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState line="Nothing open right now. Start your own hub." href="/hubs/new" />
        </div>
      ) : (
        <div className="px-gutter pb-24">
          <Mosaic>
            {roles.map((r, i) => (
              <Tile
                key={r.id}
                index={i}
                span={RHYTHM[i % RHYTHM.length]}
                tone={coverTileTone(r.hub)}
                href={`/roles/${r.id}` as Route}
                label={`${r.commitment} · ${hubNumber(r.hub.number)} ${r.hub.name}`}
                title={r.title}
                meta={r.signals.length ? <Tag>{r.signals[0].status === "ACCEPTED" ? "Joined" : "Sent"}</Tag> : undefined}
                media={<HubCover hub={r.hub} />}
              />
            ))}
          </Mosaic>
        </div>
      )}
    </PageWipe>
  );
}
