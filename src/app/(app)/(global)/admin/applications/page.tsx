import type { Metadata } from "next";
import { Card, Eyebrow } from "@/components/ui/Card";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/time";
import { AdminFrame } from "../AdminFrame";
import { ApplicationAnswer } from "../AdminControls";

export const metadata: Metadata = { title: "Applications · Admin" };

/**
 * People asking to join the app. The bar is commitment and fit, not price or
 * pedigree: are they building, and did they do something on it last week?
 */
export default async function AdminApplications() {
  await requireAdmin();
  const apps = await db.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, building: true, lastWeek: true, status: true, createdAt: true, reviewedAt: true, user: { select: { name: true, email: true } } },
  });
  const waiting = apps.filter((a) => a.status === "PENDING");
  const answered = apps.filter((a) => a.status !== "PENDING");
  return (
    <AdminFrame tab="applications" title="Applications" description="People asking to join the app. Say yes to builders who are building now: something done last week counts more than any title.">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <Eyebrow>Waiting ({waiting.length})</Eyebrow>
          {waiting.length === 0 && <p className="text-sm text-fg-subtle">Nobody waiting.</p>}
          {waiting.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-base font-medium">{a.user.name || a.user.email}</span>
                <span className="text-xs text-fg-subtle">
                  {a.user.email} · {timeAgo(a.createdAt)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-fg-muted">What are you building?</span>
                <p className="max-w-[72ch] text-base">{a.building}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-fg-muted">What did you do on it last week?</span>
                <p className="max-w-[72ch] text-base">{a.lastWeek}</p>
              </div>
              <ApplicationAnswer id={a.id} name={a.user.name.split(" ")[0] || "They"} />
            </Card>
          ))}
        </section>
        {answered.length > 0 && (
          <section className="flex flex-col gap-2">
            <Eyebrow>Answered</Eyebrow>
            {answered.map((a) => (
              <p key={a.id} className="text-sm text-fg-muted">
                {a.user.name || a.user.email} · {a.status === "APPROVED" ? "let in" : "not now"} {a.reviewedAt ? timeAgo(a.reviewedAt) : ""}
              </p>
            ))}
          </section>
        )}
      </div>
    </AdminFrame>
  );
}
