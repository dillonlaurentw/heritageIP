import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy · SELF and Sign in with Self" };

/**
 * Privacy for SELF (forself.xyz/self: the conversation, the painting, the
 * gallery) and Sign in with Self. Written to match what the Self-App does;
 * update it whenever that changes.
 */
export default function SelfPrivacy() {
  return (
    <LegalPage title="Privacy: SELF and Sign in with Self" updated="October 2026">
      <p>
        SELF listens to you, forms a private understanding of what moves you, and paints it. With Sign in with Self you
        can carry that understanding to companies you choose. This page says what we keep, who sees it, and how to stop.
      </p>

      <section className="flex flex-col gap-3">
        <h2>Your account</h2>
        <ul>
          <li>Your email (to sign you in and send codes), a password (stored only as a one-way hash), and your first name.</li>
          <li>Your date of birth and gender, stored encrypted. SELF is for adults: we ask your date of birth to confirm you&apos;re 18 or over.</li>
          <li>A scrambled form of your internet address, kept for up to two days, only to limit how many conversations can start.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Your conversation</h2>
        <ul>
          <li>You talk with SELF by voice. ElevenLabs runs the voice conversation and turns it into a transcript.</li>
          <li>Our AI provider, Anthropic, reads the transcript to write your SELF: a private profile of your beliefs, values, drives and habits. It isn&apos;t used for ads or sold.</li>
          <li>The transcript is stored encrypted and deleted once your SELF is formed, along with ElevenLabs&apos; copy. At the latest it&apos;s deleted after 7 days.</li>
          <li>Your SELF profile is stored encrypted and stays private. You see your painting, never the profile.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Your painting</h2>
        <p>
          Each piece is painted by an image service (fal.ai) from a description of colours, shapes and movement. That
          description contains nothing about you: no names, words you said, places or personal details.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Sign in with Self</h2>
        <p>When a company offers Sign in with Self and you choose Allow:</p>
        <ul>
          <li>
            <strong>The company receives:</strong> your first name and email; the five dimensions of your SELF (for
            example restrained ↔ expressive); and what Self has learned about your taste in that company&apos;s
            industry.
          </li>
          <li>
            <strong>The company can ask Self questions about you</strong> as part of its own work, for example
            “which of these jackets suits them?” or “should we email or text them?”. Self answers from what it
            understands about you, as advice to the company. Answers never quote you or reveal your profile, never
            touch anything sensitive, and never reveal what you did at other companies. Self refuses questions meant
            to exploit you (like charging you more), and questions about credit, insurance, housing or employment.
          </li>
          <li>
            <strong>The company never receives</strong> your conversation, your transcript, your full SELF profile,
            or your date of birth or gender.
          </li>
          <li>Each company sees a different ID for you, so companies can&apos;t match you to each other by it.</li>
          <li>
            <strong>What the company sends back:</strong> what you do there while signed in (for example viewed,
            saved, bought, returned, “not for me”, ratings and reasons you give). We store it encrypted.
          </li>
          <li>
            <strong>How Self learns from it:</strong> our AI provider turns that activity into a short description of
            your taste in that industry (for example “durable, natural materials; avoids loud colours”). Other
            companies in the same industry that you allow receive that description, never your activity itself and
            never what you did at which company. Activity never changes your SELF itself (your beliefs and values);
            only your conversations with SELF do.
          </li>
          <li>
            We may study patterns across many people, in groups of at least 50 and never about an individual, to
            improve SELF and to describe how people decide.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Stopping and deleting</h2>
        <ul>
          <li>
            To stop sharing with a company, write to us at [PRIVACY EMAIL]. We cut the company off at once: its access
            stops working, and Self re-learns your taste without what that company sent.
          </li>
          <li>To delete your account and everything SELF keeps about you, write to the same address.</li>
          <li>A company keeps what it already received under its own privacy policy; ask it to delete it.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Services we use</h2>
        <p>
          ElevenLabs (voice conversation), Anthropic (AI), fal.ai (paintings), Resend (email), Inngest (background
          processing), and Vercel and Prisma (hosting and database). They process data only to provide their service to
          us.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Questions</h2>
        <p>Write to us at [PRIVACY EMAIL].</p>
      </section>
    </LegalPage>
  );
}
