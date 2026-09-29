import { Redirect } from "expo-router";
import { Loading } from "@/components/ui";
import { gate, useSession } from "@/lib/session";

/** Sends you where you belong: welcome, access, waiting, onboarding or Today. */
export default function Index() {
  const { status, me } = useSession();
  if (status === "loading") return <Loading />;
  return <Redirect href={gate(me)} />;
}
