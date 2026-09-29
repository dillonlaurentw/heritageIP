import type { Metadata } from "next";
import Link from "next/link";
import { FlowSteps } from "@/components/flow/FlowSteps";
import { Ring } from "@/components/ring/Ring";
import { Topbar } from "@/components/shell/Topbar";
import { AgentMark } from "@/components/ui/AgentMark";
import { requireOnboarded } from "@/lib/session";
import { NewWorkspaceForm } from "./NewWorkspaceForm";

export const metadata: Metadata = { title: "What are you building?" };

/** Day one: an empty ring, and one question. */
export default async function NewWorkspacePage() {
  await requireOnboarded();
  return (
    <>
      <Topbar crumbs={[{ label: "You", href: "/home" }, { label: "A new idea" }]} actions={<FlowSteps current="Idea" className="hidden md:flex" />} />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 pt-6 pb-24 md:px-12 xl:grid-cols-[auto_1fr]">
        <div className="hidden justify-center xl:flex">
          <Ring nodes={[]} size={420} />
        </div>
        <section className="flex max-w-xl flex-col gap-6">
          <span className="flex items-center gap-2 text-sm text-fg-subtle">
            <AgentMark mark="St" size="sm" /> Strategist · agent
          </span>
          <h1 className="text-display font-medium text-balance">What are you building?</h1>
          <p className="text-lg leading-relaxed text-fg-muted">
            Half-formed is fine. Say it the way you&apos;d tell a friend. We&apos;ll shape it into a thesis, then find the people it
            needs.
          </p>
          <NewWorkspaceForm />
          <Link href="/new/ideas" className="text-sm text-fg-muted hover:text-fg">
            No idea yet? Start from your strengths →
          </Link>
        </section>
      </div>
    </>
  );
}
