import type { Metadata } from "next";
import { AdminShell, cellClass, FilterBar, FilterSelect, formatDate, rowClass, Table } from "@/components/admin/AdminShell";
import { Label } from "@/components/ui/Label";
import { requireAdmin, utcDayStart } from "@/lib/admin";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "People · Admin · SELF" };

const ROLES: Role[] = ["BUILDER", "BACKER", "PARTNER", "MENTOR", "ADMIN"];

export default async function AdminPeople({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  await requireAdmin();
  const { q = "", role: roleParam } = await searchParams;
  const role = ROLES.find((r) => r === roleParam);
  const term = q.trim();

  const people = await db.user.findMany({
    where: {
      ...(term && { OR: [{ name: { contains: term, mode: "insensitive" } }, { email: { contains: term, mode: "insensitive" } }] }),
      ...(role && { profile: { roles: { has: role } } }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    // Login email only. Contact fields stay behind accepted signals, even here.
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: { select: { roles: true, onboardedAt: true, simOptIn: true } },
      _count: {
        select: { hubs: true, memberships: true, agentRuns: { where: { createdAt: { gte: utcDayStart(29) }, status: { not: "DEMO" } } } },
      },
    },
  });

  return (
    <AdminShell tab="people" title="People" count={`${String(people.length).padStart(2, "0")} shown`}>
      <FilterBar action="/admin/people" q={term}>
        <FilterSelect name="role" label="Role" value={role} options={ROLES.map((r) => ({ value: r, label: r }))} />
      </FilterBar>
      {people.length === 0 ? (
        <p className="text-lead font-semibold">Nobody matches.</p>
      ) : (
        <Table head={["Person", "Roles", "Status", "Hubs", "Agent opt-in", "AI runs · 30d", "Joined"]}>
          {people.map((u) => (
            <tr key={u.id} className={rowClass}>
              <td className={cellClass}>
                <p className="font-semibold">{u.name || "No name yet"}</p>
                <p className="text-smoke">{u.email}</p>
              </td>
              <td className={cellClass}>
                <Label>{u.profile?.roles.join(" · ") || "—"}</Label>
              </td>
              <td className={cellClass}>
                <Label tone={u.profile?.onboardedAt ? "bone" : "signal"}>{u.profile?.onboardedAt ? "Onboarded" : "Onboarding"}</Label>
              </td>
              <td className={cellClass}>
                {u._count.hubs} owned{u._count.memberships ? ` · ${u._count.memberships} joined` : ""}
              </td>
              <td className={cellClass}>{u.profile?.simOptIn ? "On" : "Off"}</td>
              <td className={`${cellClass} tabular-nums`}>{u._count.agentRuns}</td>
              <td className={`${cellClass} whitespace-nowrap`}>{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </AdminShell>
  );
}
