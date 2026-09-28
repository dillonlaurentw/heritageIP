import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageWipe } from "@/components/motion/PageWipe";
import { Label } from "@/components/ui/Label";

const TABS = [
  { key: "overview", label: "Overview", href: "/admin" },
  { key: "people", label: "People", href: "/admin/people" },
  { key: "hubs", label: "Hubs", href: "/admin/hubs" },
  { key: "partners", label: "Partners", href: "/admin/partners" },
  { key: "signals", label: "Signals", href: "/admin/signals" },
  { key: "usage", label: "AI usage", href: "/admin/usage" },
] as const;

export type AdminTab = (typeof TABS)[number]["key"];

/** The admin frame: control-room label, section tabs, a title line. */
export function AdminShell({
  tab,
  title,
  count,
  children,
}: {
  tab: AdminTab;
  title: string;
  count?: string;
  children: ReactNode;
}) {
  return (
    <PageWipe>
      <section className="flex flex-col gap-8 px-edge pt-10 pb-8">
        <div className="flex justify-between gap-6">
          <Label tone="signal" live>
            Admin · SELF control room
          </Label>
          {count && <Label>{count}</Label>}
        </div>
        <h1 className="type-display text-display">{title}</h1>
        <nav aria-label="Admin sections" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.href as Route}
              aria-current={t.key === tab ? "page" : undefined}
              className={`-mb-px border-b-2 pb-3 text-small font-semibold transition-colors ${
                t.key === tab ? "border-signal text-bone" : "border-transparent text-smoke hover:text-bone"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </section>
      <div className="px-edge pb-24">{children}</div>
    </PageWipe>
  );
}

/** A GET filter bar: search box plus any selects. Works without JavaScript. */
export function FilterBar({
  action,
  q,
  placeholder = "Name or email",
  children,
}: {
  action: string;
  q?: string;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <form action={action} className="mb-6 flex flex-wrap items-end gap-3">
      <label className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
        <span className="label text-smoke">Search</span>
        <input
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="h-10 rounded-xs border border-line bg-transparent px-3 text-body outline-none placeholder:text-smoke focus:border-bone"
        />
      </label>
      {children}
      <button type="submit" className="h-10 rounded-xs border border-bone bg-bone px-4 text-small font-semibold text-field">
        Filter
      </button>
    </form>
  );
}

export function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label text-smoke">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-10 rounded-xs border border-line bg-field px-3 text-body outline-none focus:border-bone"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Tables are allowed in admin. Hairlines, mono headers, no zebra, no shadows. */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-small">
        <thead>
          <tr className="border-b border-line">
            {head.map((h) => (
              <th key={h} scope="col" className="label py-3 pr-4 font-normal whitespace-nowrap text-smoke">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const rowClass = "border-b border-line align-top last:border-b-0";
export const cellClass = "py-3 pr-4";

export function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
