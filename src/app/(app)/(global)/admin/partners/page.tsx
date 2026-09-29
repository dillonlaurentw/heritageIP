import type { Metadata, Route } from "next";
import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { CATEGORY_COPY } from "@/lib/partner-categories";
import { FeatureSwitch, ManagerSelect } from "../AdminControls";
import { AdminFrame, Table, Td } from "../AdminFrame";

export const metadata: Metadata = { title: "Partners · Admin" };

/** The partner directory: who manages each firm (linking moves waiting intros), and featuring. */
export default async function AdminPartners() {
  await requireAdmin();
  const [partners, partnerUsers, pending] = await Promise.all([
    db.partner.findMany({
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, categories: true, location: true, featured: true, claimedById: true },
    }),
    db.profile.findMany({ where: { roles: { has: "PARTNER" } }, orderBy: { createdAt: "asc" }, select: { userId: true, partnerOrgName: true, user: { select: { name: true } } } }),
    db.signal.groupBy({ by: ["partnerId"], where: { kind: "PARTNER_INTRO", status: "PENDING" }, _count: true }),
  ]);
  const waiting = new Map(pending.map((p) => [p.partnerId, p._count]));
  const unlinked = partnerUsers.filter((u) => !partners.some((p) => p.claimedById === u.userId));
  const options = partnerUsers.map((u) => ({ id: u.userId, name: u.user.name, org: u.partnerOrgName }));

  return (
    <AdminFrame
      tab="partners"
      title="Partners"
      description="Link a Partner-role person to the firm they run; intros waiting for that firm move to them. Unclaimed firms' intros go to SELF's concierge."
    >
      {unlinked.length > 0 && (
        <p className="mb-4 rounded-lg bg-bg-subtle px-4 py-3 text-sm">
          Waiting to be linked: {unlinked.map((u) => `${u.user.name}${u.partnerOrgName ? ` (says: ${u.partnerOrgName})` : ""}`).join(", ")}.
        </p>
      )}
      <Table head={["Firm", "Categories", "Location", "Managed by", "Waiting intros", "Featured"]}>
        {partners.map((p) => (
          <tr key={p.id}>
            <Td>
              <Link href={`/network/partners/${p.slug}` as Route} className="font-medium hover:underline">
                {p.name}
              </Link>
            </Td>
            <Td>
              <span className="flex flex-wrap gap-1">
                {p.categories.map((c) => (
                  <Tag key={c}>{CATEGORY_COPY[c].label}</Tag>
                ))}
              </span>
            </Td>
            <Td className="text-fg-muted">{p.location}</Td>
            <Td>
              <ManagerSelect partnerId={p.id} current={p.claimedById} options={options} />
            </Td>
            <Td>{waiting.get(p.id) ?? 0}</Td>
            <Td>
              <FeatureSwitch kind="partner" id={p.id} featured={p.featured} name={p.name} />
            </Td>
          </tr>
        ))}
      </Table>
    </AdminFrame>
  );
}
