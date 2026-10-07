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
          <li>Your email (to sign you in and send codes), a password (stored only as a one-way hash), and your first and last name.</li>
          <li>Your mobile number, so places can ask your Self to confirm it’s you in person (see Self ID below). We confirm it’s yours with a code sent by text message through Twilio, and keep a record of codes sent to limit abuse.</li>
          <li>Your date of birth and gender, stored encrypted. SELF is for adults: we ask your date of birth to confirm you&apos;re 18 or over.</li>
          <li>A scrambled form of your internet address, kept for up to two days, only to limit how many conversations can start.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Your conversation</h2>
        <ul>
          <li>You talk with SELF by voice. ElevenLabs runs the voice conversation and turns it into a transcript.</li>
          <li>
            So each conversation can pick up where the last one left off, SELF gives ElevenLabs a short summary at the start: what
            it already understands about you and what it would like to explore. Never quotes from past conversations.
          </li>
          <li>Our AI provider, Anthropic, reads the transcript to write your SELF: a private profile of your beliefs, values, drives and habits. It isn&apos;t used for ads or sold.</li>
          <li>The transcript is stored encrypted and deleted once your SELF is formed, along with ElevenLabs&apos; copy. At the latest it&apos;s deleted after 7 days.</li>
          <li>Your SELF profile is stored encrypted and stays private. You see your painting, never the profile.</li>
          <li>
            SELF also keeps what it understands as separate statements (for example a value, a habit or a taste),
            each with how sure it is, where it applies, and short notes of why in its own words, never yours. They
            build up from your conversations, from what you do at companies you allow, and from what you confirm or
            correct; older evidence counts for less over time. They&apos;re stored encrypted, included in your data
            download, and deleted with your account. What a company taught SELF goes when you stop sharing with it.
          </li>
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
            <strong>The company receives:</strong> your first and last name and email; the five dimensions of your SELF (for
            example restrained ↔ expressive); and what Self has learned about your taste in that company&apos;s
            industry.
          </li>
          <li>
            <strong>The company can ask Self questions about you</strong> as part of its own work, for example
            “which of these jackets suits them?” or “should we email or text them?”. Self answers from everything it
            understands about you (your SELF, your taste in that company&apos;s industry, and patterns from other parts
            of your life) as advice to the company. Answers never quote you or reveal your profile, never touch
            anything sensitive, and never reveal what you did at other companies or which part of your life something
            comes from. Self refuses questions meant
            to exploit you (like charging you more), and questions about credit, insurance, housing or employment.
          </li>
          <li>
            The company&apos;s team (on its SELF dashboard) and its systems and AI assistants can look you up among its
            customers and ask Self about you in the same way. Each time they do, it&apos;s logged.
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
            companies in the same industry that you allow receive that description. When any company you allow asks
            Self a question, Self may also draw on your taste in other areas, as general patterns in its advice.
            Companies never receive those other descriptions, your activity itself, or what you did at which company. Activity never changes your SELF itself (your beliefs and values);
            only your conversations with SELF do.
          </li>
          <li>
            We may study patterns across many people, in groups of at least 50 and never about an individual, to
            improve SELF and to describe how people decide. A company you allow can see the same kind of patterns
            about its own customers as a whole (for example “53% value things made well”), only for groups of at
            least 50 people. It never sees which group you&apos;re in or anything about you from these.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Self ID</h2>
        <p>
          A place you visit can ask your Self to confirm it’s you, using the phone number or email you give them. SELF asks
          you first, in the app or on the website.
        </p>
        <ul>
          <li>
            <strong>If you confirm</strong>, the place learns it’s you (the same ID it uses for you with Sign in with Self),
            your first and last name, and the Access you’ve claimed there. It&apos;s one time only: confirming doesn&apos;t connect your Self to that place or let it read your Self later.
          </li>
          <li>
            <strong>If you say it isn’t you, or don’t answer within two minutes</strong>, the place learns nothing, not even
            whether that number or email is on SELF.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Visits and regulars</h2>
        <p>
          A place you’ve connected your Self to can tell SELF when you visit (checking in, a booking, paying), so it can
          recognise you as a regular and treat you like one.
        </p>
        <ul>
          <li>The place records only that you visited: when, and optionally which of its locations and the amount. Visits count towards being a regular there, together with purchases on a card you linked.</li>
          <li>Each place sees only visits to its own places, never where else you go.</li>
          <li>Visits are in your data download, stop when you stop sharing with that place, and are deleted with your account.</li>
          <li>
            A company’s AI assistant can ask your Self how to serve you in the same way the company can, with the same
            limits: only while you share with that company, and never your conversations or written profile.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Access</h2>
        <p>
          Access shows you discounts, events and opportunities, from companies and from SELF, that suit you. Companies
          describe who an offer is for; Self decides privately, from what it understands about you, whether to show it
          to you.
        </p>
        <ul>
          <li>
            <strong>Companies never learn who was shown an offer</strong>, only how many people were. Self never
            matches offers on anything sensitive, and never shows offers aimed at people who are struggling (for
            example with money or gambling).
          </li>
          <li>
            <strong>When you claim an offer</strong>, you get a code. The company learns that the code was claimed
            when you use it or show it. If you&apos;ve signed in to that company with Self, the company can also see
            the offers you&apos;ve claimed there, so it can apply them for you.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Stopping, downloading and deleting</h2>
        <ul>
          <li>
            To stop sharing with a company, open Your account (from your Self ID, or Account in the app) and tap Stop sharing.
            The company is cut off at once: its access stops working, it&apos;s notified if it has asked to be, and Self re-learns
            your taste without what that company sent.
          </li>
          <li>To download everything SELF keeps about you, tap Download my data on the same page. You get one file.</li>
          <li>
            To delete your account and everything SELF keeps about you, use Delete account on the same page. It can&apos;t be undone.
            You can also write to us at [PRIVACY EMAIL] for any of these.
          </li>
          <li>A company keeps what it already received under its own privacy policy; ask it to delete it.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Services we use</h2>
        <p>
          ElevenLabs (voice conversation), Anthropic (AI), fal.ai (paintings), Resend (email), Twilio (text message codes), Inngest (background
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
