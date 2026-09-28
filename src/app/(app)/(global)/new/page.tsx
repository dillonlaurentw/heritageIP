import type { Metadata } from "next";
import { Screen } from "@/components/shell/Screen";
import { requireOnboarded } from "@/lib/session";
import { NewWorkspaceForm } from "./NewWorkspaceForm";

export const metadata: Metadata = { title: "New workspace" };

export default async function NewWorkspacePage() {
  await requireOnboarded();
  return (
    <Screen
      crumbs={[{ label: "Home", href: "/home" }, { label: "New workspace" }]}
      title="Start a workspace"
      description="One workspace per company or idea. Everything about it lives here: pages, plans, tasks and people."
      width="narrow"
    >
      <NewWorkspaceForm />
    </Screen>
  );
}
