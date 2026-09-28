import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/session";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const { user, profile } = await requireViewer();
  if (profile.onboardedAt) redirect("/home");

  return (
    <OnboardingFlow
        startAt={profile.onboardingStep}
        initial={{
          name: user.name ?? "",
          headline: profile.headline ?? "",
          roles: profile.roles.filter((r) => r !== "ADMIN"),
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
          contactEmail: profile.contactEmail ?? user.email,
          contactLink: profile.contactLink ?? "",
        }}
      />
  );
}
