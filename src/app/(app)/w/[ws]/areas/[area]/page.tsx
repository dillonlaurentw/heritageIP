import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { agentsLive } from "@/agents";
import { Topbar } from "@/components/shell/Topbar";
import { AgentMark } from "@/components/ui/AgentMark";
import { Avatar } from "@/components/ui/Avatar";
import { Card, Eyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { AREA_KEYS, AREAS, isAreaKey } from "@/lib/areas";
import { loadArea } from "@/lib/areas-data";
import { requireOnboarded } from "@/lib/session";
import { AGENT_COPY } from "@/lib/workspace-agents";
import { canEdit } from "@/lib/workspace-rules";
import { getWorkspaceAccess } from "@/lib/workspaces";
import { AreaSection } from "./AreaSection";

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params;
  return { title: isAreaKey(area) ? AREAS[area].name : "Area" };
}

/** One area: its working page (sections the specialist drafts), its plan steps, and the people who do this. */
export default async function AreaPage({ params }: { params: Promise<{ ws: string; area: string }> }) {
  const viewer = await requireOnboarded();
  const { ws, area } = await params;
  if (!isAreaKey(area)) notFound();
  const { workspace, role } = await getWorkspaceAccess(ws, viewer);
  const d = await loadArea(workspace, area);
  const a = d.area;
  const agent = AGENT_COPY[a.agent];
  const editable = canEdit(role);
  const base = `/w/${workspace.slug}`;

  return (
    <>
      <Topbar
        crumbs={[
          { label: workspace.name, href: base as Route },
          { label: "Help by area", href: `${base}/areas` as Route },
          { label: a.name },
        ]}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pt-4 pb-24 md:px-12">
        <nav aria-label="Areas" className="flex flex-wrap gap-1.5">
          {AREA_KEYS.map((k) => (
            <Link
              key={k}
              href={`${base}/areas/${k}` as Route}
              className={cn("rounded-full px-3.5 py-1.5 text-sm", k === area ? "bg-surface font-medium shadow-card" : "text-fg-muted hover:text-fg")}
            >
              {AREAS[k].name}
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_21rem]">
          <main className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center gap-4 pb-2">
              <AgentMark mark={a.mark} size="lg" />
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-medium">{a.name}</h1>
                <p className="text-md text-fg-muted">{a.line}</p>
              </div>
            </div>
            {a.note && (
              <p className="rounded-lg px-5 py-3.5 text-sm leading-relaxed text-fg-muted shadow-[inset_0_0_0_1px_var(--border)]">
                {a.note}
                {area === "legal" && (
                  <>
                    {" "}
                    <Link href={`/network/partners?c=legal&ws=${workspace.slug}` as Route} className="font-medium text-fg underline underline-offset-2">
                      Legal partners
                    </Link>
                  </>
                )}
              </p>
            )}
            {d.sections.map((s) => (
              <AreaSection
                key={s.key}
                workspaceId={workspace.id}
                area={area}
                section={{ key: s.key, title: s.title, hint: s.hint }}
                saved={s.text}
                editable={editable}
                live={agentsLive()}
              />
            ))}
            {d.pageHref && (
              <Link href={d.pageHref as Route} className="self-start text-sm text-fg-muted hover:text-fg">
                Open as a page to write more, comment or edit together →
              </Link>
            )}
          </main>

          <aside className="flex flex-col gap-7 lg:sticky lg:top-20">
            {d.team.length > 0 && (
              <Group label="Your team on this">
                {d.team.map((m) => (
                  <Row key={m.id} href={`${base}/people`} lead={<Avatar name={m.name} size="lg" />} title={m.name} note={m.title} />
                ))}
              </Group>
            )}
            {area === "hiring" && d.openRoles.length > 0 && (
              <Group label="Open chairs">
                {d.openRoles.map((r) => (
                  <Row
                    key={r.id}
                    href={`${base}/matches?chair=role:${r.id}`}
                    lead={<span className="flex size-8 items-center justify-center rounded-full border-[1.5px] border-dashed border-accent text-accent">+</span>}
                    title={r.title}
                    note="See who might fit"
                  />
                ))}
              </Group>
            )}
            {(d.partners.length > 0 || d.mentors.length > 0) && (
              <Group label="People who do this">
                {d.partners.map((p) => (
                  <Row
                    key={p.slug}
                    href={`/network/partners/${p.slug}?ws=${workspace.slug}`}
                    lead={<span className="flex size-8 items-center justify-center rounded-[10px] text-[11px] font-medium shadow-[inset_0_0_0_1.5px_var(--ring-link)]">{p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</span>}
                    title={p.name}
                    note={`Partner · ${p.tagline}`}
                  />
                ))}
                {d.mentors.map((m) => (
                  <Row key={m.id} href={`${base}/matches?chair=need:MENTOR&who=${m.id}`} lead={<Avatar name={m.name} size="lg" />} title={m.name} note={`Advisor · ${m.headline ?? ""}`} />
                ))}
              </Group>
            )}
            {d.steps.length > 0 && (
              <Group label="Plan steps in this area">
                {d.steps.map((s) => (
                  <Row key={s.id} href={s.href} title={s.title} note={s.done ? "Done" : s.asked ? "Someone's been asked" : "Open"} dim={s.done} />
                ))}
              </Group>
            )}
            <Group label={`Ask the ${agent.name.toLowerCase()} agent`}>
              {agent.starters.map((q) => (
                <Row key={q} href={`${base}/agents/${a.agent}?q=${encodeURIComponent(q)}`} title={q} />
              ))}
            </Group>
          </aside>
        </div>
      </div>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  );
}

function Row({ href, lead, title, note, dim }: { href: string; lead?: React.ReactNode; title: string; note?: string; dim?: boolean }) {
  return (
    <Link href={href as Route} className="group">
      <Card className={cn("flex items-center gap-3 px-4 py-3 transition-shadow group-hover:shadow-lift", dim && "opacity-60")}>
        {lead}
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{title}</span>
          {note && <span className="truncate text-xs text-fg-muted">{note}</span>}
        </span>
      </Card>
    </Link>
  );
}
