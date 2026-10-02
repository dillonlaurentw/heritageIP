import Link from "next/link";

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
    <header className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-6 md:px-10">
      <Wordmark />
      <nav className="flex items-center gap-6 text-sm text-fg-muted md:gap-8">
        <Link href="/docs" className="hover:text-fg">
          Docs
        </Link>
        <Link href="/sandbox" className="text-fg hover:text-fg-muted">
          Sandbox
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-fg-subtle md:flex-row md:items-center md:justify-between md:px-10">
        <span className="font-display text-xl text-fg">Self</span>
        <span>Early development. The sandbox uses synthetic people; nothing here is live.</span>
        <span className="flex gap-6">
          <Link href="/docs" className="hover:text-fg">
            Docs
          </Link>
          <Link href="/docs#sharing" className="hover:text-fg">
            Permission
          </Link>
          <Link href="/sandbox" className="hover:text-fg">
            Sandbox
          </Link>
        </span>
      </div>
    </footer>
  );
}
