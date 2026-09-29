import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/shell/Topbar";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { candidatesFor, chairFor, explainMatch, inviteState, openChairs } from "@/lib/matches";
import { requireOnboarded } from "@/lib/session";
import { canEdit } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { InviteForm, Reexplain } from "./MatchActions";

export const metadata: Metadata = { title: "Matches" };

/** Who could fill an open chair, explained in words. Never a score. */
export default async function MatchesPage({ params, searchParams }: { params: Promise<{ ws: string }>; searchParams: Promise<{ chair?: string; who?: string }> }) {
  const viewer = await requireOnboarded();
  const [{ ws }, sp] = await Promise.all([params, searchParams]);
  const { workspace, role } = await getWorkspaceAccess(ws, viewer);
  const chairs = await openChairs(workspace.id);
  const chair = await chairFor(workspace.id, sp.chair ?? chairs.find((c) => c.roleId && c.kind === "cofounder")?.key);
  if (!chair) notFound();
  const people = await candidatesFor(workspace.id, viewer, chair);
  const person = people.find((p) => p.id === sp.who) ?? people[0] ?? null;
  const [why, state] = person
    ? await Promise.all([explainMatch(viewer, workspace, chair, person), inviteState(workspace.id, person.id)])
    : [null, null];
  const href = (q: Record<string, string>) => `/w/${workspace.slug}/matches?${new URLSearchParams({ chair: chair.key, ...q })}` as Route;
  const first = person?.name.split(" ")[0] ?? "";

  return (
    <>
      <Topbar crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` as Route }, { label: "Matches" }]} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pt-4 pb-24 md:px-12">
        <div className="flex flex-col gap-4">
          <h1 className="text-title font-medium">Who could fill {chair.roleId ? `“${chair.title}”` : chair.title.toLowerCase()}</h1>
          <nav aria-label="Open chairs" className="flex flex-wrap gap-1.5">
            {chairs.map((c) => (
              <Link
                key={c.key}
                href={`/w/${workspace.slug}/matches?chair=${encodeURIComponent(c.key)}` as Route}
                className={cn("rounded-full px-3.5 py-1.5 text-sm", c.key === chair.key ? "bg-surface font-medium shadow-card" : "text-fg-muted hover:text-fg")}
              >
                {c.title}
              </Link>
            ))}
          </nav>
        </div>

        {!person ? (
          <Card lift className="flex flex-col gap-3 p-10">
            <h2 className="text-2xl font-medium">No one yet</h2>
            <p className="max-w-xl text-md text-fg-muted">
              {chair.kind === "advisor"
                ? "No mentors are taking requests in this area right now. Browse all mentors, or ask again next week."
                : "Nobody who's open to matches fits this yet. Posting the role puts it in front of builders looking for their next thing."}
            </p>
            <div className="flex gap-2 pt-2">
              {chair.kind === "advisor" ? (
                <LinkButton href={`/network/mentors?ws=${workspace.slug}` as Route} variant="primary" size="md">
                  Browse mentors
                </LinkButton>
              ) : (
                <LinkButton href={`/network/roles/post?ws=${workspace.slug}` as Route} variant="primary" size="md">
                  Post the role
                </LinkButton>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_20rem]">
            <Card lift className="flex flex-col gap-7 px-8 py-9 md:px-10">
              <div className="flex flex-wrap items-center gap-5">
                <Avatar name={person.name} size="xl" />
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="text-3xl font-medium">{person.name}</h2>
                  <p className="text-md text-fg-muted">{[person.headline, person.location].filter(Boolean).join(" · ")}</p>
                </div>
              </div>

              {why?.ok ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_16rem]">
                  <div className="flex flex-col gap-3">
                    <Eyebrow>Where {first} might fit</Eyebrow>
                    {why.fit.map((f, i) => (
                      <p key={i} className="text-md leading-relaxed">
                        {f}
                      </p>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Eyebrow>Worth asking</Eyebrow>
                    {why.askAbout.map((q, i) => (
                      <p key={i} className="text-base leading-relaxed text-fg-muted">
                        {q}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-fg-muted">{why && !why.ok ? why.message : ""}</p>
              )}

              <div className="flex flex-col gap-4 border-t border-border pt-6">
                {chair.kind === "advisor" ? (
                  <LinkButton href={`/network/mentors/${person.id}?ws=${workspace.slug}` as Route} variant="primary" size="lg" className="self-start">
                    Ask {first} to mentor you
                  </LinkButton>
                ) : state === "ACCEPTED" ? (
                  <LinkButton href={`/messages/with/${person.id}` as Route} variant="primary" size="lg" className="self-start">
                    Open your conversation with {first}
                  </LinkButton>
                ) : state === "PENDING" ? (
                  <p className="text-base text-fg-muted">You reached out. {first} will see it in their connections; if they say yes, a conversation opens.</p>
                ) : canEdit(role) ? (
                  <InviteForm workspaceId={workspace.id} chairKey={chair.key} personId={person.id} first={first} chairTitle={chair.title} />
                ) : (
                  <p className="text-sm text-fg-muted">Members of the company can reach out.</p>
                )}
                <span className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-subtle">
                  <span>Explained in words from what you and {first} wrote. Never a score.{why?.ok && why.demo ? " Demo agent." : ""}</span>
                  {why?.ok && <Reexplain workspaceId={workspace.id} chairKey={chair.key} personId={person.id} />}
                </span>
              </div>
            </Card>

            <aside className="flex flex-col gap-2.5 lg:sticky lg:top-20">
              <Eyebrow>{people.length > 1 ? "Others who might fit" : "Only one match so far"}</Eyebrow>
              {people.map((p) => (
                <Link key={p.id} href={href({ who: p.id })} className="group">
                  <Card className={cn("flex items-center gap-3 px-4 py-3 transition-shadow group-hover:shadow-lift", p.id === person.id && "shadow-[0_0_0_1.5px_var(--ring-link)]")}>
                    <Avatar name={p.name} size="lg" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-base font-medium">{p.name}</span>
                      <span className="truncate text-sm text-fg-muted">{p.headline}</span>
                    </span>
                  </Card>
                </Link>
              ))}
              <p className="px-1 pt-2 text-xs leading-relaxed text-fg-subtle">
                {chair.kind === "advisor"
                  ? "Mentors who are taking requests."
                  : "Only people who turned on “open to matches” appear here, and only what they chose to share."}
              </p>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
