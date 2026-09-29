import type { Metadata } from "next";
import Link from "next/link";
import { Screen } from "@/components/shell/Screen";
import { requireOnboarded } from "@/lib/session";
import { SIM_LIMITS } from "@/lib/simulation-rules";
import { eligiblePeople, simsStartedToday } from "@/lib/simulations";
import { listWorkspaces } from "@/lib/workspaces";
import { NewSimulationForm } from "./NewSimulationForm";

export const metadata: Metadata = { title: "New simulation" };

export default async function NewSimulationPage() {
  const viewer = await requireOnboarded();
  const [people, workspaces, today] = await Promise.all([eligiblePeople(viewer.user.id), listWorkspaces(viewer.user.id), simsStartedToday(viewer.user.id)]);
  return (
    <Screen
      crumbs={[{ label: "Simulations", href: "/simulations" }, { label: "New" }]}
      title="Run a team simulation"
      description="AI stand-ins for you and the people you pick talk through a scenario, then SELF writes conversation starters for the real people. Everyone has to have opted in. It's a rehearsal, not a verdict."
      width="narrow"
    >
      {!viewer.profile.simOptIn ? (
        <p className="rounded-lg bg-bg-subtle px-4 py-3 text-sm">
          Your own agent has to opt in first.{" "}
          <Link href="/me/self" className="font-medium text-accent-text hover:underline">
            Turn on simulations →
          </Link>
        </p>
      ) : today >= SIM_LIMITS.perUserPerDay ? (
        <p className="rounded-lg bg-bg-subtle px-4 py-3 text-sm">That&apos;s {SIM_LIMITS.perUserPerDay} simulations today. More tomorrow.</p>
      ) : (
        <NewSimulationForm people={people} workspaces={workspaces.filter((w) => w.role !== "GUEST").map((w) => ({ id: w.id, name: w.name }))} />
      )}
    </Screen>
  );
}
