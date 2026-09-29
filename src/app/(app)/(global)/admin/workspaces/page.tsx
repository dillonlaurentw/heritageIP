import type { Metadata } from "next";
import { Tag } from "@/components/ui/Tag";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { WORKSPACE_STAGE } from "@/lib/stages";
import { formatDate } from "@/lib/time";
import { FeatureSwitch } from "../AdminControls";
import { AdminFrame, Table, Td } from "../AdminFrame";

export const metadata: Metadata = { title: "Workspaces · Admin" };

/** Company workspaces. Admins see names and counts, never page content. Featuring puts a company first in public lists. */
export default async function AdminWorkspaces() {
  await requireAdmin();
  const list = await db.workspace.findMany({
    where: { kind: "TEAM" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      stage: true,
      discoverable: true,
      featured: true,
      createdAt: true,
      members: { where: { role: "OWNER" }, take: 1, select: { user: { select: { name: true } } } },
      _count: { select: { members: true, pages: true, signals: true } },
    },
  });
  return (
    <AdminFrame tab="workspaces" title="Workspaces" description="Company workspaces. Featured ones lead the roles board and backer lists. Admins see counts, not content.">
      <Table head={["Company", "Owner", "Stage", "People", "Pages", "Signals", "Backers", "Featured", "Started"]}>
        {list.map((w) => (
          <tr key={w.id}>
            <Td>
              <span className="font-medium">{w.name}</span>
              <span className="block text-xs text-fg-subtle">{w.slug}</span>
            </Td>
            <Td>{w.members[0]?.user.name ?? "—"}</Td>
            <Td>
              <Tag color="blue">{WORKSPACE_STAGE[w.stage] ?? w.stage}</Tag>
            </Td>
            <Td>{w._count.members}</Td>
            <Td>{w._count.pages}</Td>
            <Td>{w._count.signals}</Td>
            <Td>{w.discoverable ? <Tag color="green">Open</Tag> : <span className="text-fg-subtle">Hidden</span>}</Td>
            <Td>
              <FeatureSwitch kind="workspace" id={w.id} featured={w.featured} name={w.name} />
            </Td>
            <Td className="text-fg-muted">{formatDate(w.createdAt, true)}</Td>
          </tr>
        ))}
      </Table>
    </AdminFrame>
  );
}
