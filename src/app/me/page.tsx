import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { rolesLine } from "@/lib/roles";
import { requireOnboarded } from "@/lib/session";
import { ProfileEditor } from "./ProfileEditor";

export const metadata: Metadata = { title: "You · SELF" };

export default async function MePage() {
  const { user, profile } = await requireOnboarded();
  const s = (x: string | null) => x ?? "";

  return (
    <PageWipe>
      <section className="px-edge pt-10 pb-16">
        <div className="flex justify-between">
          <Label>You · {rolesLine(profile.roles)}</Label>
          <Label>Only you see this page</Label>
        </div>
        <MaskedLines lines={["This is how", "SELF sees you."]} className="type-display mt-16 text-display" />
        <p className="measure mt-6 text-lead text-smoke">
          Change anything. Your reflection answers shape your personal agent, so the more honest, the more useful.
        </p>
        <div className="mt-8 flex flex-wrap gap-8">
          <ArrowLink href="/me/agent" size="lead" tone="signal">
            Your personal agent
          </ArrowLink>
          <ArrowLink href="/simulations" size="lead">
            Simulations
          </ArrowLink>
        </div>
      </section>
      <ProfileEditor
        initial={{
          name: user.name,
          headline: s(profile.headline),
          location: s(profile.location),
          roles: profile.roles.filter((r) => r !== "ADMIN"),
          beliefs: s(profile.beliefs),
          workStyle: s(profile.workStyle),
          buildingToward: s(profile.buildingToward),
          strengths: s(profile.strengths),
          gaps: s(profile.gaps),
          decisionStyle: s(profile.decisionStyle),
          focusAreas: profile.focusAreas as never,
          mentorNote: s(profile.mentorNote),
          backerNote: s(profile.backerNote),
          partnerOrgName: s(profile.partnerOrgName),
          contactEmail: s(profile.contactEmail),
          contactLink: s(profile.contactLink),
        }}
      />
    </PageWipe>
  );
}
