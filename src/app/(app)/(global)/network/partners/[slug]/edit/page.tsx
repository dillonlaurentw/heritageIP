import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Screen } from "@/components/shell/Screen";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { PartnerEditor } from "./PartnerEditor";

export const metadata: Metadata = { title: "Edit profile" };

/** A PARTNER user edits the firm they manage. Claiming is an admin action. */
export default async function EditPartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const slug = (await params).slug;
  const p = await db.partner.findUnique({ where: { slug } });
  if (!p || p.claimedById !== viewer.user.id) notFound();
  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Partners", href: "/network/partners" }, { label: p.name, href: `/network/partners/${slug}` }, { label: "Edit" }]}
      title={`Edit ${p.name}`}
      description="What builders see in the directory. The intro address stays private until you accept an intro."
      width="narrow"
    >
      <PartnerEditor
        partner={{
          id: p.id,
          slug,
          tagline: p.tagline,
          description: p.description,
          services: p.services,
          location: p.location,
          priceNote: p.priceNote ?? "",
          website: p.website ?? "",
          contactEmail: p.contactEmail,
        }}
      />
    </Screen>
  );
}
