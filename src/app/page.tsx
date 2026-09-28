import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";

export default function Home() {
  return (
    <PageWipe>
      <section className="flex min-h-[calc(100dvh-3.5rem)] flex-col justify-between px-edge pt-10 pb-12">
        <Label>For the builders of the future</Label>
        <div>
          <MaskedLines lines={["What are", "you building?"]} className="type-display text-hero" />
          <ArrowLink href="/style-guide" size="hero" tone="signal" className="mt-10">
            Start with a thought
          </ArrowLink>
        </div>
      </section>
    </PageWipe>
  );
}
