import type { Metadata, Route } from "next";
import Link from "next/link";
import { Screen } from "@/components/shell/Screen";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import { db } from "@/lib/db";
import { CATEGORY_COPY, categoryFromSlug, PARTNER_CATEGORIES } from "@/lib/partner-categories";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Partners" };

/** The partner directory. `?c=` filters by category; `?ws=&step=` carry a request's context through to the intro form. */
export default async function PartnersPage({ searchParams }: { searchParams: Promise<{ c?: string; ws?: string; step?: string }> }) {
  await requireOnboarded();
  const { c, ws, step } = await searchParams;
  const category = categoryFromSlug(c);
  const partners = await db.partner.findMany({
    where: category ? { categories: { has: category } } : {},
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    select: { slug: true, name: true, tagline: true, categories: true, location: true, priceNote: true, featured: true, claimedById: true },
  });
  const carry = new URLSearchParams({ ...(ws ? { ws } : {}), ...(step ? { step } : {}) }).toString();
  const link = (path: string) => (carry ? `${path}${path.includes("?") ? "&" : "?"}${carry}` : path) as Route;

  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Partners" }]}
      title={category ? CATEGORY_COPY[category].label : "Partners"}
      description="Firms that help builders make, sell and set up. Ask for an intro; when they say yes, you both get an email with each other's details."
    >
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link href={link("/network/partners")} className={`rounded-md px-2.5 py-1 text-sm ${!category ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover"}`}>
          All
        </Link>
        {PARTNER_CATEGORIES.filter((x) => x !== "OTHER").map((x) => (
          <Link
            key={x}
            href={link(`/network/partners?c=${CATEGORY_COPY[x].slug}`)}
            className={`rounded-md px-2.5 py-1 text-sm ${category === x ? "bg-bg-active font-medium" : "text-fg-muted hover:bg-bg-hover"}`}
          >
            {CATEGORY_COPY[x].label}
          </Link>
        ))}
      </div>
      {partners.length === 0 ? (
        <EmptyState title="No partners here yet." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {partners.map((p) => (
            <li key={p.slug}>
              <Link href={link(`/network/partners/${p.slug}`)} className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 hover:border-border-strong hover:bg-bg-hover">
                <span className="flex items-center gap-2">
                  <span className="text-base font-semibold">{p.name}</span>
                  {p.featured && <Tag color="orange">Featured</Tag>}
                  <span className="ml-auto text-xs text-fg-subtle">{p.location}</span>
                </span>
                <span className="text-sm text-fg-muted">{p.tagline}</span>
                <span className="mt-auto flex flex-wrap items-center gap-1 pt-1">
                  {p.categories.map((x) => (
                    <Tag key={x}>{CATEGORY_COPY[x].label}</Tag>
                  ))}
                  {p.priceNote && <span className="ml-auto text-xs text-fg-subtle">{p.priceNote}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
