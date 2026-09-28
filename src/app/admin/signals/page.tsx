import type { Metadata } from "next";
import { AdminShell, cellClass, FilterBar, FilterSelect, formatDate, rowClass, Table } from "@/components/admin/AdminShell";
import { Label } from "@/components/ui/Label";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/signal-rules";
import type { SignalKind, SignalStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Signals · Admin · SELF" };

const KINDS: { value: SignalKind; label: string }[] = [
  { value: "ROLE_INTEREST", label: "Role interest" },
  { value: "BACKER_INTEREST", label: "Backer interest" },
  { value: "MENTOR_REQUEST", label: "Mentor request" },
  { value: "PARTNER_INTRO", label: "Partner intro" },
];
const STATUSES: SignalStatus[] = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"];

/**
 * Every signal on SELF, for spotting stuck requests and spam. Private notes
 * between people are not shown here.
 */
export default async function AdminSignals({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q = "", kind: k, status: s } = await searchParams;
  const kind = KINDS.find((x) => x.value === k)?.value;
  const status = STATUSES.find((x) => x === s);
  const term = q.trim();
  const who = (field: "fromUser" | "toUser") => ({
    [field]: { OR: [{ name: { contains: term, mode: "insensitive" as const } }, { email: { contains: term, mode: "insensitive" as const } }] },
  });

  const signals = await db.signal.findMany({
    where: {
      ...(kind && { kind }),
      ...(status && { status }),
      ...(term && { OR: [who("fromUser"), who("toUser"), { hub: { name: { contains: term, mode: "insensitive" } } }] }),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      kind: true,
      status: true,
      createdAt: true,
      respondedAt: true,
      fromUser: { select: { name: true } },
      toUser: { select: { name: true } },
      hub: { select: { name: true } },
      partner: { select: { name: true } },
      roleOpening: { select: { title: true } },
      planStep: { select: { title: true } },
    },
  });
  const label = Object.fromEntries(KINDS.map((x) => [x.value, x.label]));

  return (
    <AdminShell tab="signals" title="Signals" count={`${String(signals.length).padStart(2, "0")} shown`}>
      <FilterBar action="/admin/signals" q={term} placeholder="Person or hub">
        <FilterSelect name="kind" label="Kind" value={kind} options={KINDS} />
        <FilterSelect name="status" label="Status" value={status} options={STATUSES.map((x) => ({ value: x, label: STATUS_LABEL[x] }))} />
      </FilterBar>
      {signals.length === 0 ? (
        <p className="text-lead font-semibold">No signals match.</p>
      ) : (
        <Table head={["Kind", "Status", "From → To", "About", "Sent", "Answered"]}>
          {signals.map((x) => (
            <tr key={x.id} className={rowClass}>
              <td className={`${cellClass} whitespace-nowrap`}>
                <Label>{label[x.kind]}</Label>
              </td>
              <td className={cellClass}>
                <Label tone={x.status === "PENDING" ? "signal" : x.status === "ACCEPTED" ? "bone" : "smoke"} live={x.status === "PENDING"}>
                  {STATUS_LABEL[x.status]}
                </Label>
              </td>
              <td className={cellClass}>
                {x.fromUser.name} <span className="text-smoke">→</span> {x.toUser.name}
              </td>
              <td className={cellClass}>
                <p>{[x.hub?.name, x.partner?.name ?? x.roleOpening?.title].filter(Boolean).join(" · ")}</p>
                {x.planStep && <p className="text-smoke">Step: {x.planStep.title}</p>}
              </td>
              <td className={`${cellClass} whitespace-nowrap`}>{formatDate(x.createdAt)}</td>
              <td className={`${cellClass} whitespace-nowrap`}>{formatDate(x.respondedAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </AdminShell>
  );
}
