import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { requireOnboarded } from "@/lib/session";
import { NewHubForm } from "./NewHubForm";

export const metadata: Metadata = { title: "New hub · SELF" };

export default async function NewHubPage() {
  await requireOnboarded();
  return (
    <PageWipe>
      <section className="grid min-h-[calc(100dvh-3.5rem)] grid-cols-1 gap-12 px-edge pt-10 pb-16 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col justify-between gap-10">
          <Label>New hub</Label>
          <div>
            <MaskedLines lines={["Start with", "a thought."]} className="type-display text-display" />
            <div className="mt-10 border-t border-line pt-6">
              <Label>No idea yet?</Label>
              <div className="mt-2">
                <ArrowLink href="/hubs/new/ideas" size="lead">
                  Start from nothing
                </ArrowLink>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-end">
          <NewHubForm />
        </div>
      </section>
    </PageWipe>
  );
}
