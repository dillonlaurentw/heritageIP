import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile, type TileSpan, type TileTone } from "@/components/mosaic/Tile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label, Tag } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { mentorSelect } from "@/lib/mentors";
import { FOCUS_AREAS } from "@/lib/profile-schema";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Mentors · SELF" };

const SPANS: TileSpan[] = ["half", "half", "square", "square", "square"];
const TONES: TileTone[] = ["bone", "raised", "raised", "field", "raised"];

function withContext(path: string, ctx: { hub?: string; step?: string }) {
  const q = new URLSearchParams(Object.entries(ctx).filter(([, v]) => v) as [string, string][]);
  const s = q.toString();
  return (s ? `${path}${path.includes("?") ? "&" : "?"}${s}` : path) as Route;
}

export default async function MentorsPage({ searchParams }: { searchParams: Promise<{ f?: string; hub?: string; step?: string }> }) {
  const viewer = await requireOnboarded();
  const { f, hub, step } = await searchParams;
  const focus = FOCUS_AREAS.find((x) => x === f);
  const ctx = { hub, step };

  const mentors = await db.user.findMany({
    where: {
      profile: { roles: { has: "MENTOR" }, onboardedAt: { not: null }, ...(focus && { focusAreas: { has: focus } }) },
    },
    orderBy: { name: "asc" },
    select: mentorSelect,
  });
  // Open mentors first; you last.
  mentors.sort((a, b) => Number(b.profile!.mentorOpen) - Number(a.profile!.mentorOpen) || Number(a.id === viewer.user.id) - Number(b.id === viewer.user.id));

  const chip = (label: string, value?: string) => (
    <Link
      key={label}
      href={withContext(value ? `/mentors?f=${encodeURIComponent(value)}` : "/mentors", ctx)}
      className={`rounded-xs border px-3 py-1.5 text-small font-medium transition-colors ${(value ?? undefined) === focus ? "border-bone bg-bone text-field" : "border-line hover:border-smoke"}`}
    >
      {label}
    </Link>
  );

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-10">
        <div className="flex justify-between gap-6">
          <Label>Mentors</Label>
          <Label>{String(mentors.length).padStart(2, "0")} mentors</Label>
        </div>
        <MaskedLines lines={["Learn from someone", "who's done it."]} className="type-display text-display" />
        <div className="flex flex-wrap gap-2">
          {chip("Any")}
          {FOCUS_AREAS.map((x) => chip(x, x))}
        </div>
      </section>
      {mentors.length === 0 ? (
        <div className="border-t border-line">
          <EmptyState line="No mentors in that area yet. Try another." href="/mentors" />
        </div>
      ) : (
        <div className="px-gutter pb-24">
          <Mosaic>
            {mentors.map((m, i) => (
              <Tile
                key={m.id}
                index={i}
                span={SPANS[i % SPANS.length]}
                tone={m.profile!.mentorOpen ? TONES[i % TONES.length] : "field"}
                href={withContext(`/mentors/${m.id}`, ctx)}
                label={m.profile!.focusAreas.slice(0, 3).join(" · ") || "Mentor"}
                title={m.name}
                meta={m.id === viewer.user.id ? <Tag>You</Tag> : !m.profile!.mentorOpen ? <Label>Paused</Label> : undefined}
                subtitle={m.profile!.headline}
              />
            ))}
          </Mosaic>
        </div>
      )}
    </PageWipe>
  );
}
