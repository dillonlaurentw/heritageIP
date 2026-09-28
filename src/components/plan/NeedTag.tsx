import Link from "next/link";
import type { Route } from "next";
import { NEEDS, type Need } from "@/lib/needs";

/** A step's need, linking straight to its connection area in the hub. */
export function NeedTag({ need, hubSlug }: { need: Need; hubSlug: string }) {
  return (
    <Link
      href={`/hubs/${hubSlug}/connect/${NEEDS[need].slug}` as Route}
      className="label inline-flex items-center gap-1.5 rounded-xs border border-line px-2 py-1 text-bone transition-colors duration-(--duration-fast) hover:border-signal hover:text-signal"
    >
      {NEEDS[need].label}
      <span aria-hidden>→</span>
    </Link>
  );
}
