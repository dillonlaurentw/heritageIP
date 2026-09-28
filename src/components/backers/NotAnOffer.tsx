import { Label } from "@/components/ui/Label";

/**
 * Shown on every backer surface. Plain statement of what SELF is and isn't.
 * This is product copy, not legal advice; have counsel review before launch.
 */
export function NotAnOffer() {
  return (
    <aside className="border-t border-line px-edge py-6">
      <div className="flex max-w-5xl flex-col gap-2 md:flex-row md:gap-8">
        <Label className="shrink-0 self-start">Introductions only</Label>
        <p className="text-small text-smoke">
          Nothing on SELF is an offer to sell, or a solicitation of an offer to buy, any security. SELF is not a broker-dealer,
          funding portal or investment adviser, and no money moves through SELF. Backers signal interest; if a builder says yes,
          both get each other&apos;s contact details. Anything after that happens directly between them, off SELF, under the
          rules that apply to them.
        </p>
      </div>
    </aside>
  );
}
