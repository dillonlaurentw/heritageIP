import { db } from "@/lib/db";
import { DEMO_EMAIL_DOMAIN, demoLoginEnabled } from "@/lib/demo";
import { rolesLine } from "@/lib/roles";
import { getViewer } from "@/lib/session";

/**
 * Dev/demo only: switch between seed users to test both sides of a
 * connection without two inboxes. Uses the same POST as the sign-in page.
 */
export async function DemoSwitcher() {
  if (!demoLoginEnabled()) return null;
  const viewer = await getViewer();
  if (!viewer) return null;
  const users = await db.user.findMany({
    where: { email: { endsWith: DEMO_EMAIL_DOMAIN }, profile: { onboardedAt: { not: null } } },
    orderBy: { name: "asc" },
    select: { email: true, name: true, profile: { select: { roles: true } } },
  });

  return (
    <details className="group fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)]">
      <summary className="label flex cursor-pointer list-none items-center gap-2 rounded-xs border border-signal bg-field px-3 py-2 text-signal">
        Demo · {viewer.user.name.split(" ")[0]} · Switch
      </summary>
      <div className="mt-2 max-h-[60vh] w-72 overflow-y-auto rounded-xs border border-line bg-field">
        {users.map((u) => (
          <form key={u.email} method="post" action="/api/demo-login">
            <input type="hidden" name="email" value={u.email} />
            <button
              type="submit"
              disabled={u.email === viewer.user.email}
              className="flex w-full items-baseline justify-between gap-3 border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-field-raised disabled:opacity-40"
            >
              <span className="text-small font-semibold">{u.name}</span>
              <span className="label truncate text-smoke">{rolesLine(u.profile?.roles ?? [])}</span>
            </button>
          </form>
        ))}
      </div>
    </details>
  );
}
