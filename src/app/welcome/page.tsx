import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/session";

/** Where every sign-in lands. Routes to onboarding or home. */
export default async function Welcome() {
  const { profile } = await requireViewer();
  redirect(profile.onboardedAt ? "/home" : "/onboarding");
}
