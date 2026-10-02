import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Code } from "@/components/site/Code";

/** The public front door: what Self is, how it works, and how permission works. */

const STEPS = [
  {
    title: "Connect customer identities",
    body: "Use the sign-in you already have. You send Self your own user id; Self keeps that customer's profile inside your service. No new account for the customer, no extra login screen.",
  },
  {
    title: "Record preferences and meaningful feedback",
    body: "Send what the customer tells you and the moments worth keeping: a return and the reason for it, a size that fit, a material they love. Not clickstreams.",
  },
  {
    title: "Retrieve relevant context",
    body: "Before a page renders or an agent replies, ask about this request. Self returns the preferences that apply, why each one applies, and a plain-text version ready for a prompt.",
  },
  {
    title: "Improve from the outcome",
    body: "Tell Self what happened. A purchase strengthens what worked; a return with a reason adds something to avoid. The response lists exactly what changed. What the customer says always outranks what Self infers.",
  },
  {
    title: "Share with permission",
    body: "When another participating service could help, it asks. The customer picks which categories to share, and can stop at any time. Until they say yes, nothing moves.",
  },
];

const PRINCIPLES = [
  {
    title: "Consent per purpose",
    body: "Personalization and use by AI agents are separate choices. Without them, Self refuses to record or return anything about that customer.",
  },
  {
    title: "A shared email is not permission",
    body: "Self never joins profiles across services because an email address or phone number matches. Only the customer can connect them.",
  },
  {
    title: "Shared, not merged",
    body: "Shared preferences are read at request time, labelled with where they came from, and never overwrite your own. Revoke the grant and they stop appearing on the next request.",
  },
  {
    title: "The customer narrows, never widens",
    body: "A service asks for specific categories. The customer can approve fewer, never more, and can end the grant whenever they like.",
  },
  {
    title: "Every answer explains itself",
    body: "Each item comes back with why it's relevant and whether the customer said it or Self learned it, so your product and your agents can be honest about it.",
  },
  {
    title: "Delete means delete",
    body: "One call removes everything your service holds about a customer, including their share grants. Every read and write is logged in plain words.",
  },
];

const EXAMPLE_ITEMS = [
  { stance: "Avoids", value: "synthetic down", meta: "material · learned from 2 returns" },
  { stance: "Likes", value: "commuting by bike in the rain", meta: "use · said so" },
  { stance: "Likes", value: "merino wool", meta: "material · said so twice" },
  { stance: "Likes", value: "muted earth tones", meta: "colour · shared from Fernhill Home with permission", shared: true },
];

const SNIPPET = `const self = (path: string, body: object) =>
  fetch(\`\${SELF_URL}/api/v1\${path}\`, {
    method: "POST",
    headers: { Authorization: \`Bearer \${process.env.SELF_KEY}\`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

// After your own sign-in: link the customer (idempotent)
await self("/customers", { id: user.id, consent: { personalization: true, ai_agents: true } });

// Before your agent replies: ask for context about this request
const ctx = await self("/context", { customer_id: user.id, purpose: "ai_agent", query: message });
const reply = await agent({ system: \`\${basePrompt}\\n\\n\${ctx.prompt}\`, message });

// After the customer acts: say what happened
await self("/outcomes", {
  context_id: ctx.context_id,
  result: "returned",
  item: { name: "Loft puffer", attributes: [{ category: "material", value: "synthetic down" }] },
  because: [{ category: "material", value: "synthetic down" }],
});`;

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-6 pt-10 pb-24 md:px-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div className="flex flex-col gap-7">
          <span className="text-sm text-fg-subtle">Customer context for products and AI agents</span>
          <h1 className="text-display text-balance">Understanding that carries forward.</h1>
          <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
            Give your product and AI agents relevant customer context that improves with every permitted interaction.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/sandbox" variant="primary" size="lg">
              Open the sandbox
            </LinkButton>
            <LinkButton href="/docs" variant="secondary" size="lg">
              Read the docs
            </LinkButton>
          </div>
          <p className="text-sm text-fg-subtle">Early development. Try it with synthetic customers; nothing here is live.</p>
        </div>

        <Card lift className="flex flex-col gap-5 p-6 sm:p-8" aria-label="Example context response">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-fg-muted">POST /api/v1/context</span>
            <span className="font-mono text-2xs tracking-[0.08em] text-fg-subtle uppercase">Example · synthetic</span>
          </div>
          <div className="rounded-lg bg-bg-inset px-4 py-3 text-sm text-fg-muted">
            &ldquo;I need a jacket for riding to work.&rdquo;
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {EXAMPLE_ITEMS.map((i) => (
              <li key={i.value} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                <span className="text-md">
                  <span className={i.stance === "Avoids" ? "text-accent-text" : "text-fg-muted"}>{i.stance}</span>{" "}
                  <span className="text-fg">{i.value}</span>
                </span>
                <span className={i.shared ? "text-sm text-fg" : "text-sm text-fg-subtle"}>{i.meta}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-fg-subtle">Each item says why it&apos;s here and where it came from.</p>
        </Card>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-8 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-24 md:px-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="text-sm text-fg-subtle">How it works</span>
            <h2 className="text-3xl text-balance">Self sits behind your product, not in front of it.</h2>
            <p className="text-lg leading-relaxed text-fg-muted">
              Your customers keep using your product. Self connects the interactions they allow to who they are, keeps
              their preferences structured, and hands back what matters when you need it.
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2.5">
                <span className="font-mono text-xs text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-xl font-medium">{s.title}</h3>
                <p className="leading-relaxed text-fg-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Shopping and discovery */}
      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-24 md:px-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="text-sm text-fg-subtle">Starting with AI shopping and discovery</span>
            <h2 className="text-3xl text-balance">An assistant that remembers what the customer already told you.</h2>
            <p className="text-lg leading-relaxed text-fg-muted">
              Shopping assistants start every conversation from zero, so customers repeat themselves and get the same
              suggestions they already returned. With context from Self, the first answer can be the right one.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card className="flex flex-col gap-4 p-6 sm:p-8">
              <span className="text-sm text-fg-subtle">Without context</span>
              <p className="text-md leading-relaxed text-fg-muted">
                &ldquo;Our most popular jacket is the Loft puffer, with synthetic down insulation. It&apos;s on sale this
                week.&rdquo;
              </p>
              <p className="text-sm text-fg-subtle">She returned that jacket last month: too warm for cycling.</p>
            </Card>
            <Card className="flex flex-col gap-4 p-6 sm:p-8">
              <span className="text-sm text-fg-subtle">With context from Self</span>
              <p className="text-md leading-relaxed">
                &ldquo;For riding to work in the rain, the Tempo shell is waterproof and light enough to cycle in. It layers
                over your merino crew, and it comes in a clay colour.&rdquo;
              </p>
              <p className="text-sm text-fg-subtle">Avoids synthetic down, rides in the rain, likes merino; colour shared by Fernhill Home with her permission.</p>
            </Card>
          </div>
          <p className="text-sm text-fg-subtle">Illustrative example with synthetic data. The sandbox runs this flow against the real API.</p>
        </div>
      </section>

      {/* Permission */}
      <section id="permission" className="scroll-mt-8 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-24 md:px-10">
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="text-sm text-fg-subtle">Permission</span>
            <h2 className="text-3xl text-balance">Understanding is only useful if customers trust it.</h2>
            <p className="text-lg leading-relaxed text-fg-muted">
              The long-term aim is shared understanding across the services a customer uses. That only works if every
              step is something the customer agreed to, so the rules are enforced by the API, not left to policy.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <Card key={p.title} className="flex flex-col gap-2 p-6">
                <h3 className="text-lg font-medium">{p.title}</h3>
                <p className="leading-relaxed text-fg-muted">{p.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-6 py-24 md:px-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-4">
            <span className="text-sm text-fg-subtle">Integration</span>
            <h2 className="text-3xl text-balance">Three calls around the interaction you already have.</h2>
            <p className="text-lg leading-relaxed text-fg-muted">
              Link the customer after your own sign-in. Ask for context before you respond. Report the outcome after.
              Everything else (consent, sharing, deletion) is a single call when you need it.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <LinkButton href="/docs#quickstart" variant="secondary" size="md">
                Quickstart
              </LinkButton>
              <LinkButton href="/docs#api" variant="ghost" size="md">
                API reference
              </LinkButton>
            </div>
          </div>
          <Code code={SNIPPET} label="TypeScript" className="self-start" />
        </div>
      </section>

      {/* Where it's going */}
      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-24 md:px-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="text-sm text-fg-subtle">Where this is going</span>
            <h2 className="text-3xl text-balance">One service at a time, then across them, with permission.</h2>
            <p className="text-lg leading-relaxed text-fg-muted">
              Self starts with shopping and discovery. Identities, consent, categories and share grants are not specific
              to shopping, so other kinds of services can join when there&apos;s a real partner to build with. Today
              there is a sandbox, an API and these docs; no production customers.
            </p>
          </div>
          <LinkButton href="/sandbox" variant="primary" size="lg">
            Try it with synthetic customers
          </LinkButton>
        </div>
      </section>
    </main>
  );
}
