import type { Metadata } from "next";
import { Screen } from "@/components/shell/Screen";
import { workspaceOptions } from "@/lib/network";
import { requireOnboarded } from "@/lib/session";
import { PostRoleForm } from "./PostRoleForm";

export const metadata: Metadata = { title: "Post a role" };

export default async function PostRolePage({ searchParams }: { searchParams: Promise<{ ws?: string; step?: string }> }) {
  const viewer = await requireOnboarded();
  const { ws, step } = await searchParams;
  const options = await workspaceOptions(viewer);
  return (
    <Screen
      crumbs={[{ label: "Network", href: "/network" }, { label: "Roles", href: "/network/roles" }, { label: "Post a role" }]}
      title="Post a role"
      description="Posted roles show your company's name, one-liner and thesis statement to other builders. Your plans, pages and contacts stay private."
      width="narrow"
    >
      <PostRoleForm options={options} defaultWs={ws} defaultStep={step} />
    </Screen>
  );
}
