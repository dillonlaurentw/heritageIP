import type { Route } from "next";
import { ArrowLink } from "@/components/ui/ArrowLink";

/** One bold line and an arrow. Nothing else. */
export function EmptyState<T extends string>({ line, href }: { line: string; href: Route<T> }) {
  return (
    <div className="px-edge py-[18vh]">
      <ArrowLink href={href} size="hero" className="max-w-[18ch]">
        {line}
      </ArrowLink>
    </div>
  );
}
