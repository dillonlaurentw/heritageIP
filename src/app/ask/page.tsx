import { PageWipe } from "@/components/motion/PageWipe";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/Label";

export default function AskPage() {
  return (
    <PageWipe>
      <div className="px-edge pt-10">
        <Label>Ask SELF · Arrives with hub agents</Label>
      </div>
      <EmptyState line="Soon, SELF answers back. Start a hub first." href="/style-guide" />
    </PageWipe>
  );
}
