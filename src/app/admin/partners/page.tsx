import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { AdminShell, cellClass, FilterBar, FilterSelect, rowClass, Table } from "@/components/admin/AdminShell";
import { FeatureToggle } from "@/components/admin/FeatureToggle";
import { Label } from "@/components/ui/Label";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { CATEGORY_COPY, PARTNER_CATEGORIES } from "@/lib/partner-categories";
import { assignPartnerManager, togglePartnerFeatured } from "../actions";

export const metadata: Metadata = { title: "Partners · Admin · SELF" };

export default async function AdminPartners({ searchParams }: { searchParams: Promise<{ q?: string; c?: string; m?: string }> }) {
  await requireAdmin();
  const { q = "", c, m } = await searchParams;
  const category = PARTNER_CATEGORIES.find((x) => x === c);
  const term = q.trim();

  const [partners, partnerPeople] = await Promise.all([
    db.partner.findMany({
      where: {
        ...(term && { name: { contains: term, mode: "insensitive" } }),
        ...(category && { categories: { has: category } }),
        ...(m === "managed" && { claimedById: { not: null } }),
        ...(m === "concierge" && { claimedById: null }),
      },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        location: true,
        categories: true,
        featured: true,
        claimedById: true,
        signals: { select: { status: true } },
      },
    }),
    db.user.findMany({
      where: { profile: { roles: { has: "PARTNER" } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, partner: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <AdminShell tab="partners" title="Partners" count={`${String(partners.length).padStart(2, "0")} shown`}>
      <p className="measure mb-8 text-body text-smoke">
        Featured partners lead the directory. Link a person with the Partner role to let them edit the profile and answer
        intros; their waiting intros move with it. Unlinked firms go through SELF&apos;s concierge.
      </p>
      <FilterBar action="/admin/partners" q={term} placeholder="Firm name">
        <FilterSelect
          name="c"
          label="Category"
          value={category}
          options={PARTNER_CATEGORIES.map((x) => ({ value: x, label: CATEGORY_COPY[x].label }))}
        />
        <FilterSelect
          name="m"
          label="Managed by"
          value={m}
          options={[
            { value: "managed", label: "A partner" },
            { value: "concierge", label: "Concierge" },
          ]}
        />
      </FilterBar>
      {partners.length === 0 ? (
        <p className="text-lead font-semibold">No partners match.</p>
      ) : (
        <Table head={["Partner", "Categories", "Intros", "Managed by", ""]}>
          {partners.map((p) => {
            const waiting = p.signals.filter((s) => s.status === "PENDING").length;
            const made = p.signals.filter((s) => s.status === "ACCEPTED").length;
            return (
              <tr key={p.id} className={rowClass}>
                <td className={cellClass}>
                  <Link href={`/partners/${p.slug}` as Route} className="font-semibold hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-smoke">{p.location}</p>
                </td>
                <td className={cellClass}>
                  <Label>{p.categories.map((x) => CATEGORY_COPY[x].label).join(" · ")}</Label>
                </td>
                <td className={`${cellClass} whitespace-nowrap tabular-nums`}>
                  {made} made
                  {waiting > 0 && <span className="text-signal"> · {waiting} waiting</span>}
                </td>
                <td className={cellClass}>
                  <form action={assignPartnerManager} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <select
                      name="userId"
                      defaultValue={p.claimedById ?? ""}
                      aria-label={`Who manages ${p.name}`}
                      className="max-w-[16rem] rounded-xs border border-line bg-field px-2 py-1.5 text-small outline-none focus:border-bone"
                    >
                      <option value="">SELF concierge</option>
                      {partnerPeople.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                          {u.partner && u.partner.id !== p.id ? ` (now ${u.partner.name})` : ""}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="label rounded-xs border border-line px-2.5 py-1.5 text-smoke hover:border-bone hover:text-bone">
                      Save
                    </button>
                  </form>
                </td>
                <td className={`${cellClass} text-right`}>
                  <FeatureToggle id={p.id} featured={p.featured} action={togglePartnerFeatured} name={p.name} />
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </AdminShell>
  );
}
