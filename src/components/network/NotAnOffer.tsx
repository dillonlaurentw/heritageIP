/**
 * Shown on every backer surface. Plain statement of what SELF is and isn't.
 * This is product copy, not legal advice; have counsel review before launch.
 */
export function NotAnOffer() {
  return (
    <aside className="mt-12 border-t border-border pt-5 text-xs leading-relaxed text-fg-subtle">
      <p className="max-w-3xl">
        <span className="font-medium text-fg-muted">Introductions only.</span> Nothing on SELF is an offer to sell, or a solicitation of an
        offer to buy, any security. SELF is not a broker-dealer, funding portal or investment adviser, and no money moves through SELF.
        Backers signal interest; if a builder says yes, both get each other&apos;s contact details. Anything after that happens directly
        between them, off SELF, under the rules that apply to them.
      </p>
    </aside>
  );
}
