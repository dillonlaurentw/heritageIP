import type { Metadata, Route } from "next";
import Link from "next/link";
import { Screen } from "@/components/shell/Screen";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { FOCUS_AREAS } from "@/lib/profile-schema";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Mentors" };

export default async function MentorsPage({ searchParams }: { searchParams: Promise<{ f?: string; ws?: string; step?: string }> }) {
  const viewer = await requireOnboarded();
  const { f, ws, step } = await searchParams;
  const focus = FOCUS_AREAS.find((a) => a === f);
  const mentors = await db.profile.findMany({
    where: { roles: { has: "MENTOR" }, userId: { not: viewer.user.id }, ...(focus ? { focusAreas: { has: focus } } : {}) },
    orderBy: [{ mentorOpen: "desc" }, { createdAt: "asc" }],
    select: { userId: true, headline: true, location: true, focusAreas: true, mentorNote: true, mentorOpen: true, user: { select: { name: true } } },
  });
  const carry = new URLSearchParams({ ...(ws ? { ws } : {}), ...(step ? { step } : {}) }).toString();
  const withCarry = (path: string) => (carry ? `${path}${path.includes("?") ? "&" : "?"}${carry}` : path) as Route;

  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Mentors" }]}
      title="Mentors"
      description="People who've done it. Ask for a conversation; if they say yes, you both get each other's details."
    >
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link href={withCarry("/network/mentors")} className={`rounded-md px-2.5 py-1 text-sm ${!focus ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover"}`}>
          All
        </Link>
        {FOCUS_AREAS.slice(0, 12).map((a) => (
          <Link
            key={a}
            href={withCarry(`/network/mentors?f=${encodeURIComponent(a)}`)}
            className={`rounded-md px-2.5 py-1 text-sm ${focus === a ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover"}`}
          >
            {a}
          </Link>
        ))}
      </div>
      {mentors.length === 0 ? (
        <EmptyState title="No mentors in this area yet." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {mentors.map((m) => (
            <li key={m.userId}>
              <Link href={withCarry(`/network/mentors/${m.userId}`)} className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 hover:border-border-strong hover:bg-bg-hover">
                <span className="flex items-center gap-3">
                  <Avatar name={m.user.name} size="lg" />
                  <span className="min-w-0">
                    <span className="block text-base font-semibold">{m.user.name}</span>
                    <span className="block truncate text-sm text-fg-muted">{m.headline}</span>
                  </span>
                  {!m.mentorOpen && <Tag className="ml-auto">Paused</Tag>}
                </span>
                {m.mentorNote && <span className="line-clamp-2 text-sm text-fg-muted">{m.mentorNote}</span>}
                <span className="mt-auto flex flex-wrap gap-1">
                  {m.focusAreas.slice(0, 4).map((a) => (
                    <Tag key={a}>{a}</Tag>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
