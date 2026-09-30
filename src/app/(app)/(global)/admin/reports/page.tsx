import type { Metadata } from "next";
import { Card, Eyebrow } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/admin";
import { REPORT_REASONS, type ReportReason } from "@/lib/app-rules";
import { openReports } from "@/lib/app/safety";
import { timeAgo } from "@/lib/time";
import { AdminFrame } from "../AdminFrame";
import { ReportAnswer } from "../AdminControls";

export const metadata: Metadata = { title: "Reports · Admin" };

const KIND: Record<string, string> = { PERSON: "a person", MESSAGE: "a message", CIRCLE_MESSAGE: "a circle message", OPPORTUNITY: "an opportunity", UPDATE: "a backer update" };

/**
 * The moderation queue. Admins see the reported text as the reporter shared
 * it (a copy taken when they reported), never anyone's journal or other content.
 */
export default async function AdminReports() {
  await requireAdmin();
  const reports = await openReports();
  const open = reports.filter((r) => r.status === "OPEN");
  const done = reports.filter((r) => r.status === "RESOLVED");
  return (
    <AdminFrame tab="reports" title="Reports" description="What people have reported. Remove what breaks the rules; suspend people who keep doing it. Every report gets an answer.">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <Eyebrow>Open ({open.length})</Eyebrow>
          {open.length === 0 && <p className="text-sm text-fg-subtle">Nothing to review.</p>}
          {open.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-base">
                  <span className="font-medium">{r.reporter.name}</span> reported {KIND[r.kind]} by <span className="font-medium">{r.targetUser.name}</span>
                </span>
                <span className="text-xs text-fg-subtle">
                  {timeAgo(r.createdAt)} · {r.reportsAboutThem} {r.reportsAboutThem === 1 ? "report" : "reports"} about them
                  {r.targetUser.profile?.access === "NONE" ? " · suspended" : ""}
                </span>
              </div>
              <p className="text-sm text-fg-muted">{REPORT_REASONS[r.reason as ReportReason] ?? r.reason}{r.note ? `: “${r.note}”` : ""}</p>
              {r.excerpt && <blockquote className="max-w-[72ch] border-l-2 border-border pl-3 text-base whitespace-pre-wrap">{r.excerpt}</blockquote>}
              <ReportAnswer id={r.id} canRemove={!!r.targetId && r.kind !== "PERSON"} />
            </Card>
          ))}
        </section>
        {done.length > 0 && (
          <section className="flex flex-col gap-2">
            <Eyebrow>Resolved</Eyebrow>
            {done.slice(0, 40).map((r) => (
              <p key={r.id} className="text-sm text-fg-muted">
                {r.targetUser.name} · {REPORT_REASONS[r.reason as ReportReason] ?? r.reason} · {r.resolution}
              </p>
            ))}
          </section>
        )}
      </div>
    </AdminFrame>
  );
}
