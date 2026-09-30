import Link from "next/link";
import type { ReactNode } from "react";

/** A plain page for policies: wordmark, title, readable text. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-12 md:px-12">
      <Link href="/" className="text-[17px] font-semibold tracking-[0.18em]">
        SELF
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-medium">{title}</h1>
        <p className="text-sm text-fg-subtle">Last updated {updated}. A plain-language draft; our lawyers review it before launch.</p>
      </div>
      <div className="flex max-w-[72ch] flex-col gap-6 text-md leading-relaxed [&_h2]:text-lg [&_h2]:font-medium [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">{children}</div>
      <p className="text-sm text-fg-subtle">
        <Link href="/privacy" className="hover:text-fg">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="hover:text-fg">
          Terms
        </Link>
      </p>
    </div>
  );
}
