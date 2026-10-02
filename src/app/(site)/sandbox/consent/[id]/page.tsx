import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { DemoLabel } from "@/components/site/SiteChrome";
import { ConsentForm } from "@/components/sandbox/ConsentForm";
import { categoryLabel } from "@/lib/self/domains";
import { readSandbox } from "@/lib/self/sandbox";
import { grantForCustomer } from "@/lib/self/store";

export const metadata = { title: "Share your preferences?" };

/**
 * Self's consent screen, as the customer sees it. In production the
 * customer would arrive from the receiving service and sign in at the source
 * service; in the sandbox both steps are simulated and labelled.
 */
export default async function ConsentPage({ params }: { params: Promise<{ id: string }> }) {
  const sandbox = await readSandbox();
  if (!sandbox) notFound();
  const found = await grantForCustomer(sandbox.id, (await params).id);
  if (!found) notFound();
  const { grant, sourceAccounts } = found;
  const to = grant.toProfile.service.name;
  const from = grant.sourceService.name;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 pt-6 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <DemoLabel>Sandbox · simulated customer</DemoLabel>
        <span className="text-sm text-fg-muted">You&apos;re seeing this as {grant.toProfile.displayName ?? grant.toProfile.externalId}.</span>
      </div>
      <Card lift className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="flex flex-col gap-3">
          <span className="font-display text-2xl">Self</span>
          <h1 className="text-3xl text-balance">
            {to} would like to use what {from} knows about your preferences.
          </h1>
          <p className="text-fg-muted">
            {to} says: &ldquo;{grant.reason}&rdquo;
          </p>
        </div>

        {grant.status === "PENDING" ? (
          <ConsentForm
            grantId={grant.id}
            from={from}
            to={to}
            requested={grant.categories.map((c) => ({ key: c, label: categoryLabel(c) }))}
            accounts={sourceAccounts.map((a) => ({ id: a.id, label: a.displayName ?? a.externalId, detail: `${a.externalId}${a.email ? ` · ${a.email}` : ""}` }))}
          />
        ) : (
          <div className="flex flex-col gap-2 rounded-lg bg-bg-subtle px-5 py-4">
            <span className="font-medium">
              {grant.status === "ACTIVE" && `Sharing ${grant.categories.map((c) => categoryLabel(c).toLowerCase()).join(" and ")} from ${from} with ${to}.`}
              {grant.status === "DECLINED" && "You declined. Nothing was shared."}
              {grant.status === "REVOKED" && "Sharing stopped. Nothing more is shared."}
            </span>
            {grant.status === "ACTIVE" && (
              <span className="text-sm text-fg-muted">
                {to} reads it each time it asks, labelled as coming from {from}. Stop sharing and it disappears from the next request.
              </span>
            )}
          </div>
        )}
      </Card>
      <Link href="/sandbox" className="self-start text-sm text-fg-muted hover:text-fg">
        ← Back to the sandbox
      </Link>
    </main>
  );
}
