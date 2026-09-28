import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { googleSignIn } from "@/app/actions/auth";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Arrow } from "@/components/ui/ArrowLink";
import { Hairline } from "@/components/ui/Hairline";
import { Label } from "@/components/ui/Label";
import { googleEnabled } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEMO_EMAIL_DOMAIN, demoLoginEnabled } from "@/lib/demo";
import { rolesLine } from "@/lib/roles";
import { getViewer } from "@/lib/session";
import { MagicLinkForm } from "./MagicLinkForm";

export const metadata: Metadata = { title: "Sign in · SELF" };


export default async function SignInPage() {
  if (await getViewer()) redirect("/welcome");

  const demoUsers = demoLoginEnabled()
    ? await db.user.findMany({
        where: { email: { endsWith: DEMO_EMAIL_DOMAIN } },
        orderBy: { name: "asc" },
        select: { email: true, name: true, profile: { select: { roles: true, headline: true } } },
      })
    : [];

  return (
    <PageWipe>
      <section className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 gap-12 px-edge pt-10 pb-16 md:grid-cols-2">
        <div className="flex flex-col justify-between gap-10">
          <Label>Sign in · Sign up · Same thing</Label>
          <MaskedLines lines={["Come in."]} className="type-display text-hero" />
        </div>
        <div className="flex flex-col justify-end gap-10">
          <p className="measure text-lead text-smoke">
            No passwords. Give us your email and we&apos;ll send a link that gets you in.
          </p>
          <MagicLinkForm />
          {googleEnabled && (
            <form action={googleSignIn}>
              <button type="submit" className="group text-lead font-semibold">
                Or continue with Google <Arrow />
              </button>
            </form>
          )}
        </div>
      </section>

      {demoUsers.length > 0 && (
        <section className="px-edge pb-24">
          <Hairline className="mb-4" />
          <div className="mb-6 flex justify-between">
            <Label tone="signal">Demo · Sign in as</Label>
            <Label>Seed users · Dev only</Label>
          </div>
          <div className="grid grid-cols-1 border-t border-line md:grid-cols-2">
            {demoUsers.map((u) => (
              <form key={u.email} method="post" action="/api/demo-login" className="border-b border-line md:odd:border-r">
                <input type="hidden" name="email" value={u.email} />
                <button
                  type="submit"
                  className="group flex w-full items-center justify-between gap-4 px-1 py-4 text-left transition-colors duration-(--duration-fast) hover:bg-field-raised md:px-4"
                >
                  <span className="min-w-0">
                    <span className="type-display block text-title transition-[--wdth] duration-(--duration-base) ease-out-strong group-hover:[--wdth:115]">
                      {u.name}
                    </span>
                    <span className="mt-1 block truncate text-small text-smoke">{u.profile?.headline}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <Label>{rolesLine(u.profile?.roles ?? [])}</Label>
                    <Arrow className="text-signal" />
                  </span>
                </button>
              </form>
            ))}
          </div>
        </section>
      )}
    </PageWipe>
  );
}
