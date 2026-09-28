import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Arrow } from "@/components/ui/ArrowLink";
import { getViewer } from "@/lib/session";

const linkClass = "text-small font-medium text-smoke transition-colors duration-(--duration-fast) hover:text-bone";

/** Wordmark, a few text links, one persistent "Ask SELF anything →". */
export async function Nav() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-field">
      <nav className="flex h-14 items-center justify-between gap-6 px-edge">
        <Link href={viewer ? "/home" : "/"} className="type-display text-[1.375rem] leading-none tracking-[-0.04em]">
          SELF
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {viewer ? (
            <>
              <Link href="/home" className={linkClass}>
                Home
              </Link>
              <Link href="/me" className={linkClass}>
                You
              </Link>
              <form action={signOut}>
                <button type="submit" className={linkClass}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/style-guide" className={linkClass}>
                Style guide
              </Link>
              <Link href="/sign-in" className={linkClass}>
                Sign in
              </Link>
            </>
          )}
        </div>
        <Link
          href="/ask"
          transitionTypes={["nav-forward"]}
          className="group inline-flex items-baseline gap-2 text-small font-semibold text-bone"
        >
          <span className="hidden sm:inline">Ask SELF anything</span>
          <span className="sm:hidden">Ask SELF</span>
          <Arrow className="text-signal" />
        </Link>
      </nav>
    </header>
  );
}
