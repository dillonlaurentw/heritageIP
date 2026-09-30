import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms" };

/** The rules of SELF, in plain words. */
export default function Terms() {
  return (
    <LegalPage title="Terms" updated="October 2026">
      <p>SELF is invite-only and built on trust. By using it you agree to these terms.</p>
      <section className="flex flex-col gap-3">
        <h2>Be someone people want to build with</h2>
        <ul>
          <li>No harassment, bullying or hate. No spam or selling.</li>
          <li>No scams, and no asking members for money or investment through SELF.</li>
          <li>Don&apos;t share what someone told you in your circle without asking them.</li>
          <li>You can block or report anyone. We review every report, remove what breaks these rules, and suspend people who keep breaking them.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Not an investment platform</h2>
        <p>SELF makes introductions. Nothing on SELF is an offer to buy or sell securities, and no money moves on SELF. Anything about money happens directly between you and the other person, off SELF, and is your responsibility.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>AI is a helper, not an adviser</h2>
        <p>SELF&apos;s agents help you think. They can be wrong. They are not legal, financial or medical advice. The legal explainer says so every time.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Opportunities</h2>
        <p>Dinners, trips and events are run by their hosts, not by SELF. Hosts pick who comes. SELF takes no payments for them; the host says who covers what.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Your work stays yours</h2>
        <p>What you write in SELF belongs to you. You give us permission to store it and show it to the people you share it with, and nothing more.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Leaving</h2>
        <p>You can delete your account at any time from the app. We may suspend accounts that break these terms.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Questions</h2>
        <p>Write to us at [CONTACT EMAIL].</p>
      </section>
    </LegalPage>
  );
}
