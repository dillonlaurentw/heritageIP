import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

/** The public Self site: home, docs and the sandbox. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
