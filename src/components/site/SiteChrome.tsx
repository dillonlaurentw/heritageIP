import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

/** The Self wordmark: the serif, quiet. */
export function Wordmark() {
  return (
    <Link href="/" className="font-display text-[28px] leading-none tracking-[-0.01em] text-fg" aria-label="Self home">
      Self
    </Link>
  );
}

/** "Sandbox" in mono: on every demo surface so nothing reads as production. */
export function DemoLabel({ children = "Sandbox" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-accent-soft px-2.5 font-mono text-2xs font-medium tracking-[0.08em] text-accent-text uppercase">
      {children}
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-6 px-6 md:px-10">
      <Wordmark />
      <nav className="flex items-center gap-1 text-sm text-fg-muted sm:gap-5">
        <Link href="/#how" className="hidden px-2 hover:text-fg sm:inline">
          How it works
        </Link>
        <Link href="/#permission" className="hidden px-2 hover:text-fg sm:inline">
          Permission
        </Link>
        <Link href="/docs" className="px-2 hover:text-fg">
          Docs
        </Link>
        <LinkButton href="/sandbox" variant="primary" size="sm">
          Open the sandbox
        </LinkButton>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-fg-muted md:flex-row md:items-start md:justify-between md:px-10">
        <div className="flex max-w-sm flex-col gap-2">
          <span className="font-display text-xl text-fg">Self</span>
          <p>
            Self is in early development. The sandbox runs on synthetic customers and a local API; there is no production
            service yet.
          </p>
        </div>
        <div className="flex gap-10">
          <div className="flex flex-col gap-2">
            <span className="text-fg-subtle">Build</span>
            <Link href="/docs" className="hover:text-fg">
              Documentation
            </Link>
            <Link href="/docs#api" className="hover:text-fg">
              API reference
            </Link>
            <Link href="/sandbox" className="hover:text-fg">
              Sandbox
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-fg-subtle">Principles</span>
            <Link href="/#permission" className="hover:text-fg">
              Permission
            </Link>
            <Link href="/docs#sharing" className="hover:text-fg">
              Sharing across services
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
