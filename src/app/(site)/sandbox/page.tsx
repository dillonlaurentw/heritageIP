import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DemoLabel } from "@/components/site/SiteChrome";
import { SandboxConsole } from "@/components/sandbox/SandboxConsole";
import { openSandbox, resetSandbox } from "@/app/actions/sandbox";
import { readSandbox } from "@/lib/self/sandbox";
import { SANDBOX_DAYS } from "@/lib/self/sandbox-data";
import { auditLog } from "@/lib/self/store";

export const metadata = { title: "Sandbox" };

export default async function SandboxPage() {
  const sandbox = await readSandbox();

  if (!sandbox)
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 pt-10 pb-24 md:px-10">
        <DemoLabel>Demo · synthetic data</DemoLabel>
        <h1 className="text-title text-balance">A sandbox with synthetic customers.</h1>
        <p className="text-lg leading-relaxed text-fg-muted">
          Your sandbox has two fictional services, a shopping assistant and a home goods shop, and a few made-up customers
          with history. You get a sandbox key for each service and a console that calls the local Self API with it, so you
          can see every request and response.
        </p>
        <Card className="flex flex-col gap-4 p-6">
          <ul className="flex flex-col gap-2.5 text-fg-muted">
            <li>Retrieve context before an interaction, and see why each item was included.</li>
            <li>Record an outcome and see exactly which preferences changed.</li>
            <li>Ask another service to share, approve it as the customer, then revoke it.</li>
            <li>Run into consent rules: the API refuses what a customer hasn&apos;t allowed.</li>
          </ul>
          <form action={openSandbox}>
            <Button type="submit" variant="primary" size="lg">
              Create my sandbox
            </Button>
          </form>
          <p className="text-sm text-fg-subtle">
            No sign-up. It&apos;s tied to this browser and deleted after {SANDBOX_DAYS} days. None of the people or companies
            in it exist.
          </p>
        </Card>
      </main>
    );

  const audit = await auditLog(sandbox.id);
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-4 pt-2 pb-20 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-full bg-accent-soft py-2 pr-2 pl-4">
        <span className="flex items-center gap-3 text-sm">
          <span className="font-mono text-2xs font-medium tracking-[0.08em] text-accent-text uppercase">Sandbox</span>
          <span className="text-fg">Synthetic customers and a local API. Not a production service.</span>
        </span>
        <form action={resetSandbox}>
          <Button type="submit" variant="secondary" size="xs">
            Reset to the start
          </Button>
        </form>
      </div>
      <SandboxConsole
        services={sandbox.services}
        daysLeft={Math.max(1, Math.ceil((sandbox.expiresAt.getTime() - Date.now()) / 86_400_000))}
        audit={audit}
      />
    </main>
  );
}
