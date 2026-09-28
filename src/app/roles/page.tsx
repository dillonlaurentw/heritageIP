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
    // Featured hubs (set by admins) lead the mosaic.
    orderBy: [{ hub: { featured: "desc" } }, { createdAt: "desc" }],
    include: {
      hub: { select: { name: true, number: true, featured: true, coverLayout: true, coverTone: true, coverImageUrl: true } },
      signals: { where: { fromUserId: viewer.user.id, status: { in: ["PENDING", "ACCEPTED"] } }, select: { status: true } },
    },
  });

  // The viewer's own hubs and the roles they've posted, so they can post from here too.
  const myHubs = await db.hub.findMany({
    where: { ownerId: viewer.user.id },
    orderBy: { number: "asc" },
    select: {
      slug: true,
      name: true,
      number: true,
      roleOpenings: {
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, commitment: true, signals: { where: { status: "PENDING" }, select: { id: true } } },
      },
    },
  });
  const myRoles = myHubs.flatMap((h) => h.roleOpenings.map((r) => ({ ...r, hub: h })));

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

      <section className="grid grid-cols-1 gap-6 border-t border-line px-edge py-10 md:grid-cols-[16rem_1fr]">
        <Label className="self-start">Your roles</Label>
        <div className="flex flex-col gap-8">
          {myRoles.length > 0 && (
            <ul className="flex flex-col">
              {myRoles.map((r) => (
                <li key={r.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/hubs/${r.hub.slug}/team` as Route}
                    className="group flex flex-wrap items-baseline justify-between gap-4 py-4"
                  >
                    <span>
                      <Label>
                        {r.commitment} · {hubNumber(r.hub.number)} {r.hub.name}
                      </Label>
                      <span className="mt-1 block text-lead font-semibold group-hover:underline">{r.title}</span>
                    </span>
                    <Label tone={r.signals.length ? "signal" : "smoke"} live={r.signals.length > 0}>
                      {r.signals.length ? `${r.signals.length} interested` : "No interest yet"}
                    </Label>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {myHubs.length === 0 ? (
            <Link href="/hubs/new" className="group type-display text-headline">
              Start a hub to post a role <span className="inline-block text-signal transition-transform group-hover:translate-x-2">→</span>
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="type-display text-headline">Post a role</p>
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                {myHubs.map((h) => (
                  <Link
                    key={h.slug}
                    href={`/hubs/${h.slug}/team?compose=1#post-role` as Route}
                    className="group text-body font-semibold text-signal"
                  >
                    {myHubs.length === 1 ? `For ${h.name}` : h.name}{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {roles.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState line="Nothing open from other builders right now." href="/hubs/new" />
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
                meta={
                  r.signals.length ? (
                    <Tag>{r.signals[0].status === "ACCEPTED" ? "Joined" : "Sent"}</Tag>
                  ) : r.hub.featured ? (
                    <Tag>Featured</Tag>
                  ) : undefined
                }
                media={<HubCover hub={r.hub} />}
              />
            ))}
          </Mosaic>
        </div>
      )}
    </PageWipe>
  );
}
