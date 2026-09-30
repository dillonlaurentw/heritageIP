import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** Shown to signed-in people who aren't members of the app yet. */
export function MembersOnly() {
  return (
    <Card lift className="flex flex-col items-start gap-4 p-8">
      <h2 className="text-2xl font-medium">This is for SELF&apos;s members</h2>
      <p className="max-w-lg text-md text-fg-muted">SELF is invite-only for now: not by price or pedigree, by what you did last week. Enter a member&apos;s invite code, or apply with two questions.</p>
      <LinkButton href="/app/access" variant="primary">
        I have an invite, or apply
      </LinkButton>
    </Card>
  );
}
