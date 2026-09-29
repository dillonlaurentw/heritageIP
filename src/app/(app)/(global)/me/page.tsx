import type { Metadata } from "next";
import { Screen } from "@/components/shell/Screen";
import { requireOnboarded } from "@/lib/session";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const { user, profile } = await requireOnboarded();
  return (
    <Screen
      crumbs={[{ label: "Your profile" }]}
      title="Your profile"
      description="How you show up on SELF. Your answers are where your Self starts; you can see and change every line of it under Your Self."
      width="narrow"
    >
      <ProfileForm
        initial={{
          name: user.name ?? "",
          headline: profile.headline ?? "",
          location: profile.location ?? "",
          roles: profile.roles.filter((r) => r !== "ADMIN") as never,
          beliefs: profile.beliefs ?? "",
          workStyle: profile.workStyle ?? "",
          buildingToward: profile.buildingToward ?? "",
          strengths: profile.strengths ?? "",
          gaps: profile.gaps ?? "",
          decisionStyle: profile.decisionStyle ?? "",
          focusAreas: profile.focusAreas as never,
          mentorNote: profile.mentorNote ?? "",
          backerNote: profile.backerNote ?? "",
          partnerOrgName: profile.partnerOrgName ?? "",
          contactEmail: profile.contactEmail ?? "",
          contactLink: profile.contactLink ?? "",
        }}
      />
    </Screen>
  );
}
