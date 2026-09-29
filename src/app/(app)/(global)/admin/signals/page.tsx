import type { Metadata, Route } from "next";
import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";
import { AdminFrame, Table, Td } from "../AdminFrame";

export const metadata: Metadata = { title: "Signals · Admin" };

const KINDS = ["ROLE_INTEREST", "BACKER_INTEREST", "MENTOR_REQUEST", "PARTNER_INTRO"] as const;
const STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;
const label = (s: string) => s.replace("_", " ").toLowerCase();

/** Every request on SELF, to spot what's stuck. Notes are shown; contact details never are. */
export default async function AdminSignals({ searchParams }: { searchParams: Promise<{ k?: string; s?: string }> }) {
  await requireAdmin();
  const { k, s } = await searchParams;
  const kind = KINDS.find((x) => x === k);
  const status = STATUSES.find((x) => x === s);
  const signals = await db.signal.findMany({
    where: { ...(kind ? { kind } : {}), ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      kind: true,
      status: true,
      note: true,
      createdAt: true,
      fromUser: { select: { name: true } },
      toUser: { select: { name: true } },
      workspace: { select: { name: true } },
      partner: { select: { name: true } },
      page: { select: { title: true } },
    },
  });
  const link = (params: { k?: string; s?: string }) => `/admin/signals?${new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])}` as Route;
  const chip = (active: boolean) => cn("rounded-md px-2 py-0.5 text-xs", active ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover");

  return (
    <AdminFrame tab="signals" title="Signals" description="Every request between people: roles, backers, mentors and partner intros. Newest first.">
      <div className="mb-4 flex flex-wrap items-center gap-1">
        <Link href={link({ s })} className={chip(!kind)}>
          All kinds
        </Link>
        {KINDS.map((x) => (
          <Link key={x} href={link({ k: x, s })} className={chip(kind === x)}>
            {label(x)}
          </Link>
        ))}
        <span className="mx-2 h-4 w-px bg-border" />
        <Link href={link({ k })} className={chip(!status)}>
          Any status
        </Link>
        {STATUSES.map((x) => (
          <Link key={x} href={link({ k, s: x })} className={chip(status === x)}>
            {label(x)}
          </Link>
        ))}
      </div>
      <Table head={["Kind", "From", "To", "About", "Note", "Status", "When"]}>
        {signals.map((x) => (
          <tr key={x.id}>
            <Td>
              <Tag>{label(x.kind)}</Tag>
            </Td>
            <Td className="whitespace-nowrap">{x.fromUser.name}</Td>
            <Td className="whitespace-nowrap">{x.partner ? `${x.partner.name} (via ${x.toUser.name})` : x.toUser.name}</Td>
            <Td className="max-w-48 truncate text-fg-muted">{[x.workspace?.name, x.page?.title].filter(Boolean).join(" · ")}</Td>
            <Td className="max-w-72 truncate text-fg-muted">{x.note}</Td>
            <Td>
              <Tag color={x.status === "PENDING" ? "yellow" : x.status === "ACCEPTED" ? "green" : "gray"}>{label(x.status)}</Tag>
            </Td>
            <Td className="whitespace-nowrap text-fg-subtle">{timeAgo(x.createdAt)}</Td>
          </tr>
        ))}
      </Table>
    </AdminFrame>
  );
}
