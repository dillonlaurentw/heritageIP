import type { Metadata, Route } from "next";
import Link from "next/link";
import { Topbar } from "@/components/shell/Topbar";
import { AgentMark } from "@/components/ui/AgentMark";
import { Card, NeedsDot } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { areaCards } from "@/lib/areas-data";
import { requireOnboarded } from "@/lib/session";
import { getWorkspaceAccess } from "@/lib/workspaces";

export const metadata: Metadata = { title: "Help by area" };

/** Eight parts of building a company, each with a specialist and the people who do this work. */
export default async function AreasPage({ params }: { params: Promise<{ ws: string }> }) {
  const viewer = await requireOnboarded();
  const { workspace } = await getWorkspaceAccess((await params).ws, viewer);
  const cards = await areaCards(workspace);
  return (
    <>
      <Topbar crumbs={[{ label: workspace.name, href: `/w/${workspace.slug}` as Route }, { label: "Help by area" }]} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pt-4 pb-24 md:px-12">
        <div className="flex max-w-3xl flex-col gap-2">
          <h1 className="text-title font-medium">Help, by area</h1>
          <p className="text-md leading-relaxed text-fg-muted">
            Each area has a specialist that knows your thesis, your plan and your team, and the people on SELF who do this for a living.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.key} href={`/w/${workspace.slug}/areas/${c.key}` as Route} className="group">
              <Card
                className={cn(
                  "flex h-full min-h-48 flex-col gap-3 p-5 transition-shadow group-hover:shadow-lift",
                  c.needsYou && "shadow-[0_0_0_1.5px_var(--accent)]",
                )}
              >
                <span className="flex items-center justify-between">
                  <AgentMark mark={c.mark} />
                  {c.needsYou && (
                    <span className="flex items-center gap-1.5 text-xs text-accent-text">
                      <NeedsDot className="size-1.5" /> Needs you
                    </span>
                  )}
                </span>
                <span className="text-lg font-medium">{c.name}</span>
                <span className="text-sm leading-relaxed text-fg-muted">{c.now}</span>
                {c.people && <span className="mt-auto text-xs text-fg-subtle">{c.people}</span>}
              </Card>
            </Link>
          ))}
        </div>
        <Link href={`/ask?ws=${workspace.slug}` as Route} className="group">
          <Card className="flex items-center gap-3 px-5 py-4 transition-shadow group-hover:shadow-lift">
            <AgentMark mark="?" />
            <span className="flex-1 text-base text-fg-muted">Not sure which area? Ask anything, and SELF will send it to the right one.</span>
            <span className="font-mono text-xs text-fg-subtle">⌘K</span>
          </Card>
        </Link>
      </div>
    </>
  );
}
