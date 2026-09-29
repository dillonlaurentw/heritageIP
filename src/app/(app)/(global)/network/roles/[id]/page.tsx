import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { expressInterest } from "@/app/actions/network";
import { NoteForm } from "@/components/network/NoteForm";
import { Screen } from "@/components/shell/Screen";
import { LinkButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { blocksToText } from "@/lib/blocks";
import { db } from "@/lib/db";
import { optionOf } from "@/lib/db-schema";
import { postedRole } from "@/lib/network";
import { pageHref } from "@/lib/pages";
import { requireOnboarded } from "@/lib/session";
import { SYSTEM_DBS } from "@/lib/system-dbs";
import { readThesis } from "@/lib/thesis";
import { roleIn } from "@/lib/workspaces";

export const metadata: Metadata = { title: "Role" };

const commitmentProp = SYSTEM_DBS.roles.schema.properties.find((p) => p.id === "commitment")!;

/** One posted role: the company's name, one-liner and thesis statement, and the role. Nothing private. */
export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireOnboarded();
  const role = await postedRole((await params).id);
  if (!role) notFound();
  const ws = role.row.workspace;
  const [thesis, mine, existing] = await Promise.all([
    readThesis(ws.id),
    roleIn(ws.id, viewer.user.id),
    db.signal.findFirst({ where: { kind: "ROLE_INTEREST", fromUserId: viewer.user.id, pageId: role.row.id }, orderBy: { createdAt: "desc" }, select: { status: true } }),
  ]);
  const c = optionOf(commitmentProp, role.props.commitment);
  const body = blocksToText(role.row.content);

  return (
    <Screen crumbs={[{ label: "Network", href: "/network" }, { label: "Roles", href: "/network/roles" }, { label: role.row.title }]} width="narrow">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-fg-muted">{ws.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{role.row.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {c && <Tag color={c.color}>{c.name}</Tag>}
            {!role.open && <Tag>Closed</Tag>}
            {typeof role.props.skills === "string" && role.props.skills && <span className="text-sm text-fg-muted">{role.props.skills}</span>}
          </div>
        </div>
        {body && <p className="text-md leading-relaxed whitespace-pre-line">{body}</p>}
        <section className="rounded-lg bg-bg-subtle p-4">
          <p className="text-xs font-medium text-fg-subtle">About {ws.name}</p>
          {ws.oneLiner && <p className="mt-1 text-base font-medium">{ws.oneLiner}</p>}
          {thesis && <p className="mt-2 text-sm text-fg-muted">{thesis.statement}</p>}
        </section>

        {mine ? (
          <div className="flex items-center gap-3 border-t border-border pt-5 text-sm text-fg-muted">
            This is your company&apos;s role.
            <LinkButton href={pageHref(ws.slug, role.row.id) as Route}>Open in workspace</LinkButton>
          </div>
        ) : existing && existing.status !== "WITHDRAWN" && existing.status !== "DECLINED" ? (
          <p className="border-t border-border pt-5 text-sm text-fg-muted">
            {existing.status === "ACCEPTED" ? "They said yes. Their details are in Connections." : "You've said you're interested. You'll hear back in Connections."}
          </p>
        ) : role.open ? (
          <div className="border-t border-border pt-5">
            <NoteForm
              send={expressInterest.bind(null, role.row.id)}
              cta="I'm interested"
              label="Why you, in a few sentences"
              placeholder="What you've done that fits, what draws you to this, how much time you have."
              sentText="Sent. If they say yes, you'll both get each other's details in Connections."
            />
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
