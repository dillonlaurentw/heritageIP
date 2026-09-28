import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Label } from "@/components/ui/Label";
import { requireOnboarded } from "@/lib/session";
import { IdeaGenerator } from "./IdeaGenerator";

export const metadata: Metadata = { title: "Find an idea · SELF" };
// Agent calls can take a while.
export const maxDuration = 120;

export default async function IdeasPage() {
  await requireOnboarded();
  return (
    <PageWipe>
      <section className="flex flex-col gap-12 px-edge pt-10 pb-24">
        <Label>New hub · From your profile</Label>
        <div>
          <MaskedLines lines={["Start from", "who you are."]} className="type-display text-display" />
          <p className="measure mt-6 text-lead text-smoke">
            SELF reads what you told it about yourself and suggests ideas you&apos;re unusually placed to build.
            Pick one to start a hub, or ask for different ones.
          </p>
        </div>
        <IdeaGenerator />
      </section>
    </PageWipe>
  );
}
