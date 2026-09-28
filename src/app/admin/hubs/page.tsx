import type { Metadata } from "next";
import { AdminShell, cellClass, FilterBar, FilterSelect, formatDate, rowClass, Table } from "@/components/admin/AdminShell";
import { FeatureToggle } from "@/components/admin/FeatureToggle";
import { Label } from "@/components/ui/Label";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { hubNumber, STAGE_LABEL } from "@/lib/hubs";
import { toggleHubFeatured } from "../actions";

export const metadata: Metadata = { title: "Hubs · Admin · SELF" };

const SHOW = [
  { value: "featured", label: "Featured" },
  { value: "public", label: "Public somewhere" },
  { value: "private", label: "Private" },
];

/**
 * Every hub. Admins see names and counts, not thesis text or plans: those
 * are the builder's. "Public" means an open role or backer discovery, the
 * only places a featured hub actually shows up.
 */
export default async function AdminHubs({ searchParams }: { searchParams: Promise<{ q?: string; show?: string }> }) {
  await requireAdmin();
  const { q = "", show } = await searchParams;
  const term = q.trim();
  const isPublic = { OR: [{ discoverable: true }, { roleOpenings: { some: { status: "OPEN" as const } } }] };

  const hubs = await db.hub.findMany({
    where: {
      ...(term && {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { owner: { name: { contains: term, mode: "insensitive" } } },
          { owner: { email: { contains: term, mode: "insensitive" } } },
        ],
      }),
      ...(show === "featured" && { featured: true }),
      ...(show === "public" && isPublic),
      ...(show === "private" && { NOT: isPublic }),
    },
    orderBy: [{ featured: "desc" }, { number: "asc" }],
    select: {
      id: true,
      number: true,
      name: true,
      stage: true,
      sector: true,
      discoverable: true,
      featured: true,
      createdAt: true,
      owner: { select: { name: true } },
      roleOpenings: { where: { status: "OPEN" }, select: { id: true } },
      planSteps: { select: { doneAt: true } },
      _count: { select: { members: true, signals: true } },
    },
  });

  return (
    <AdminShell tab="hubs" title="Hubs" count={`${String(hubs.length).padStart(2, "0")} shown`}>
      <p className="measure mb-8 text-body text-smoke">
        Featured hubs lead the open-roles and backer mosaics. A private hub has nowhere to be featured until it posts a role
        or opens to backers.
      </p>
      <FilterBar action="/admin/hubs" q={term} placeholder="Hub or owner">
        <FilterSelect name="show" label="Show" value={show} options={SHOW} />
      </FilterBar>
      {hubs.length === 0 ? (
        <p className="text-lead font-semibold">No hubs match.</p>
      ) : (
        <Table head={["Hub", "Owner", "Stage", "Visible on", "Team", "Plan", "Signals", "Started", ""]}>
          {hubs.map((h) => {
            const visible = [h.roleOpenings.length ? "Roles" : null, h.discoverable ? "Backers" : null].filter(Boolean);
            const done = h.planSteps.filter((s) => s.doneAt).length;
            return (
              <tr key={h.id} className={rowClass}>
                <td className={cellClass}>
                  <Label>{hubNumber(h.number)}</Label>
                  <p className="font-semibold">{h.name}</p>
                  {h.sector && <p className="text-smoke">{h.sector}</p>}
                </td>
                <td className={cellClass}>{h.owner.name}</td>
                <td className={cellClass}>
                  <Label>{STAGE_LABEL[h.stage]}</Label>
                </td>
                <td className={cellClass}>
                  <Label tone={visible.length ? "bone" : "smoke"}>{visible.length ? visible.join(" · ") : "Private"}</Label>
                </td>
                <td className={`${cellClass} tabular-nums`}>{h._count.members + 1}</td>
                <td className={`${cellClass} tabular-nums whitespace-nowrap`}>
                  {h.planSteps.length ? `${done}/${h.planSteps.length}` : "—"}
                </td>
                <td className={`${cellClass} tabular-nums`}>{h._count.signals}</td>
                <td className={`${cellClass} whitespace-nowrap`}>{formatDate(h.createdAt)}</td>
                <td className={`${cellClass} text-right`}>
                  <FeatureToggle id={h.id} featured={h.featured} action={toggleHubFeatured} name={h.name} />
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </AdminShell>
  );
}
