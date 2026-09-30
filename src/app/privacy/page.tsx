import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy" };

/** What SELF keeps, why, who sees it, and how to delete it. Written to match what the product actually does. */
export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="October 2026">
      <p>SELF is a place for founders to think, and to find the people they need. That only works if what you write here is safe. This page says what we keep, who can see it, and how to delete it.</p>
      <section className="flex flex-col gap-3">
        <h2>Your journal is yours</h2>
        <ul>
          <li>Only you can read your journal. Not your circle, not mentors, not backers, and not SELF&apos;s team.</li>
          <li>To answer you, SELF sends your journal lines and the lines of your Self you approved to our AI provider (Anthropic), which processes them to write the reply. It isn&apos;t used to show you ads or sold to anyone.</li>
          <li>When you hold to talk, your phone turns speech into text. Where your phone supports it this happens on the phone; otherwise your phone&apos;s speech service (Apple or Google) may process the audio. SELF never receives the recording, only the text.</li>
          <li>You can share one entry with your circle when you choose, and delete any entry for good.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2>What we keep</h2>
        <ul>
          <li>Your email (to sign you in) and the name and details you give us.</li>
          <li>What you write in SELF: your Self, circle messages, messages, requests, updates you share with backers, and your companies&apos; pages.</li>
          <li>Push notification tokens for your phones, so we can tell you when someone answers.</li>
          <li>Basic records of use (for example how many AI replies we generated), to keep SELF running and affordable.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Who sees what</h2>
        <ul>
          <li>Your circle sees what you post in your circle.</li>
          <li>People see the parts of your profile you chose to share (for example if you switch on &quot;open to building with someone&quot;).</li>
          <li>Backers see your updates only if you switch on &quot;open to backers&quot;, and never your journal.</li>
          <li>Your contact details are shared only when someone says yes to a request between you.</li>
          <li>If someone reports a message, a copy of that message goes to SELF&apos;s team so we can act on it.</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Money</h2>
        <p>SELF doesn&apos;t take payments, hold money or offer investments, so we don&apos;t collect card or bank details.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Deleting your account</h2>
        <p>In the app: You → Delete my account. Your journal, your Self, your messages and everything that was only yours is deleted. Companies you share with others pass to the next teammate, so they don&apos;t lose their work.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2>Questions</h2>
        <p>Write to us at [PRIVACY EMAIL].</p>
      </section>
    </LegalPage>
  );
}
