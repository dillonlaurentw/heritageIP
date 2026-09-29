import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { googleSignIn } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { googleEnabled } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEMO_EMAIL_DOMAIN, demoLoginEnabled } from "@/lib/demo";
import { rolesLine } from "@/lib/roles";
import { getViewer } from "@/lib/session";
import { MagicLinkForm } from "./MagicLinkForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getViewer()) redirect(next?.startsWith("/") && !next.startsWith("//") ? (next as "/home") : "/home");

  const demoUsers = demoLoginEnabled()
    ? await db.user.findMany({
        where: { email: { endsWith: DEMO_EMAIL_DOMAIN } },
        orderBy: { name: "asc" },
        select: { email: true, name: true, profile: { select: { roles: true, headline: true } } },
      })
    : [];

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-[12vh] pb-16">
      <Link href="/" className="mb-8 text-[17px] font-semibold tracking-[0.18em]">
        SELF
      </Link>
      <div className="w-full max-w-sm">
        <h1 className="text-center text-xl font-semibold tracking-tight">Sign in or create an account</h1>
        <p className="mt-1.5 mb-6 text-center text-sm text-fg-muted">No passwords. We&apos;ll email you a link that gets you in.</p>
        <MagicLinkForm next={next} />
        {googleEnabled && (
          <form action={googleSignIn} className="mt-3">
            <Button type="submit" size="md" className="h-9 w-full">
              Continue with Google
            </Button>
          </form>
        )}
      </div>

      {demoUsers.length > 0 && (
        <section className="mt-14 w-full max-w-2xl">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-medium">Demo: sign in as</h2>
            <span className="text-xs text-fg-subtle">Seed people · dev only</span>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            {demoUsers.map((u) => (
              <form key={u.email} method="post" action="/api/demo-login" className="bg-bg">
                <button type="submit" name="email" value={u.email} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-hover">
                  <Avatar name={u.name || u.email} size="lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">{u.name || u.email}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {rolesLine(u.profile?.roles ?? [])}
                      {u.profile?.headline ? ` · ${u.profile.headline}` : ""}
                    </span>
                  </span>
                </button>
              </form>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
