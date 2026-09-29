import type { Metadata, Route } from "next";
import { Tag } from "@/components/ui/Tag";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/time";
import { AdminFrame, Table, Td } from "../AdminFrame";

export const metadata: Metadata = { title: "People · Admin" };

export default async function AdminPeople({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = (await searchParams).q?.trim().slice(0, 80) ?? "";
  const users = await db.user.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: { select: { roles: true, onboardedAt: true, simOptIn: true, headline: true } },
      _count: { select: { memberships: true } },
    },
  });
  return (
    <AdminFrame tab="people" title="People" description="Everyone with an account. Login emails are shown to admins only.">
      <form className="mb-4 flex gap-2" action={"/admin/people" as Route}>
        <input name="q" defaultValue={q} placeholder="Search by name or email" className="h-8 w-72 rounded-md border border-border bg-bg px-2.5 text-sm outline-none focus:border-accent" />
      </form>
      <Table head={["Name", "Email", "Roles", "Workspaces", "Onboarded", "Sim opt-in", "Joined"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td>
              <span className="font-medium">{u.name}</span>
              {u.profile?.headline && <span className="block max-w-64 truncate text-xs text-fg-muted">{u.profile.headline}</span>}
            </Td>
            <Td className="text-fg-muted">{u.email}</Td>
            <Td>
              <span className="flex flex-wrap gap-1">
                {(u.profile?.roles ?? []).map((r) => (
                  <Tag key={r} color={r === "ADMIN" ? "red" : r === "BACKER" ? "green" : r === "PARTNER" ? "orange" : r === "MENTOR" ? "blue" : "gray"}>
                    {r.toLowerCase()}
                  </Tag>
                ))}
              </span>
            </Td>
            <Td>{u._count.memberships}</Td>
            <Td>{u.profile?.onboardedAt ? "Yes" : <span className="text-fg-subtle">Not yet</span>}</Td>
            <Td>{u.profile?.simOptIn ? "On" : <span className="text-fg-subtle">Off</span>}</Td>
            <Td className="text-fg-muted">{formatDate(u.createdAt, true)}</Td>
          </tr>
        ))}
      </Table>
    </AdminFrame>
  );
}
