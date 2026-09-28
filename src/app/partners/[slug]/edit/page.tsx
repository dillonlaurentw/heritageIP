import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { db } from "@/lib/db";
import { requireOnboarded } from "@/lib/session";
import { PartnerEditor } from "./PartnerEditor";

export const metadata: Metadata = { title: "Edit partner profile · SELF" };

export default async function EditPartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const viewer = await requireOnboarded();
  const partner = await db.partner.findUnique({ where: { slug: (await params).slug } });
  if (!partner || partner.claimedById !== viewer.user.id) notFound();

  return (
    <PageWipe>
      <section className="flex flex-col gap-10 px-edge pt-10 pb-12">
        <div className="flex justify-between">
          <ArrowLink href={`/partners/${partner.slug}`} size="inline" className="text-smoke">
            {partner.name}
          </ArrowLink>
          <Label>Your partner profile</Label>
        </div>
        <h1 className="type-display text-display">Edit profile.</h1>
      </section>
      <section className="px-edge">
        <PartnerEditor
          partnerId={partner.id}
          slug={partner.slug}
          initial={{
            tagline: partner.tagline,
            description: partner.description,
            services: partner.services.join("\n"),
            location: partner.location,
            priceNote: partner.priceNote ?? "",
            website: partner.website ?? "",
            contactEmail: partner.contactEmail,
          }}
        />
      </section>
    </PageWipe>
  );
}
