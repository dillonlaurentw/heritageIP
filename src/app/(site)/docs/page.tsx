import Link from "next/link";
import type { ReactNode } from "react";
import { Code } from "@/components/site/Code";
import { DemoLabel } from "@/components/site/SiteChrome";
import { SHOPPING } from "@/lib/self/domains";
import { SANDBOX_DAYS } from "@/lib/self/sandbox-data";

export const metadata = { title: "Docs" };

/** Integration documentation. Every example matches the sandbox API exactly. */

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "concepts", label: "Concepts" },
  { id: "quickstart", label: "Quickstart" },
  { id: "auth", label: "Authentication" },
  { id: "api", label: "API reference" },
  { id: "consent", label: "Consent" },
  { id: "sharing", label: "Sharing across services" },
  { id: "learning", label: "How outcomes teach" },
  { id: "categories", label: "Categories" },
  { id: "errors", label: "Errors" },
  { id: "sandbox", label: "Sandbox limits" },
];

const H = "http://localhost:3000";

type Field = [name: string, type: string, desc: string];
type Endpoint = { id: string; method: string; path: string; summary: string; fields?: Field[]; example?: string; response: string; errors?: string[] };

const ENDPOINTS: Endpoint[] = [
  {
    id: "link-customer",
    method: "POST",
    path: "/api/v1/customers",
    summary:
      "Link a customer after they sign in to your product. Idempotent on your user id: call it on every sign-in. Self never looks at other services when linking, even when the email matches.",
    fields: [
      ["id", "string", "Your own user id (letters, numbers, _ . : @ -). Required."],
      ["display_name", "string", "Optional. Shown in your sandbox only."],
      ["email", "string", "Optional. Stored for display. Never used to match profiles."],
      ["consent", "object", "Optional. { personalization, ai_agents } booleans, as the customer chose them in your product."],
    ],
    example: `{ "id": "cad_5001", "display_name": "Ada Brooks", "consent": { "personalization": true, "ai_agents": true } }`,
    response: `{
  "environment": "sandbox",
  "created": true,
  "customer": {
    "id": "cad_5001",
    "display_name": "Ada Brooks",
    "email": null,
    "consent": { "personalization": true, "ai_agents": true, "updated_at": "2026-10-02T09:12:44.120Z" },
    "created_at": "2026-10-02T09:12:44.120Z"
  }
}`,
  },
  {
    id: "list-customers",
    method: "GET",
    path: "/api/v1/customers",
    summary: "Customers linked to your service, with their consent and how many preferences each has.",
    response: `{ "environment": "sandbox", "customers": [ { "id": "cad_1042", "display_name": "Maya Okafor", "preference_count": 6, … } ] }`,
  },
  {
    id: "get-customer",
    method: "GET",
    path: "/api/v1/customers/{id}",
    summary: "Everything your service holds about one customer: consent, preferences, the last 20 events, and share grants in both directions.",
    response: `{
  "environment": "sandbox",
  "id": "cad_1042",
  "consent": { "personalization": true, "ai_agents": true, "updated_at": "…" },
  "preferences": [
    { "category": "material", "value": "merino wool", "stance": "LIKES", "source": "STATED", "evidence": 2, "note": null, "last_evidence_at": "…" }
  ],
  "events": [ { "id": "…", "kind": "return", "summary": "Returned a synthetic puffer: too warm for cycling", … } ],
  "sharing": { "incoming": [], "outgoing": [] }
}`,
    errors: ["customer_not_found"],
  },
  {
    id: "consent",
    method: "PUT",
    path: "/api/v1/customers/{id}/consent",
    summary: "Relay a change the customer made in your product's settings. Send one or both.",
    fields: [
      ["personalization", "boolean", "Record preferences and use them in your service."],
      ["ai_agents", "boolean", "Give this customer's context to AI agents."],
    ],
    example: `{ "ai_agents": false }`,
    response: `{ "environment": "sandbox", "consent": { "personalization": true, "ai_agents": false, "updated_at": "…" } }`,
    errors: ["customer_not_found", "invalid_request"],
  },
  {
    id: "preferences",
    method: "POST",
    path: "/api/v1/customers/{id}/preferences",
    summary:
      "Preferences the customer told you, and things they asked you to forget. A stated preference always wins over an observed one; saying the same thing again adds evidence.",
    fields: [
      ["preferences", "array", "{ category, value, stance: \"LIKES\" | \"AVOIDS\", note? }, up to 50."],
      ["forget", "array", "{ category, value } to remove, up to 50."],
    ],
    example: `{
  "preferences": [{ "category": "fit", "value": "Shoe size EU 41", "stance": "LIKES" }],
  "forget": [{ "category": "budget", "value": "under $200 for outerwear" }]
}`,
    response: `{ "environment": "sandbox", "preferences": [ … the customer's preferences after the change … ] }`,
    errors: ["consent_required", "customer_not_found", "invalid_request", "limit_reached"],
  },
  {
    id: "events",
    method: "POST",
    path: "/api/v1/customers/{id}/events",
    summary: "A meaningful interaction to keep: feedback, a purchase, a support question. Events stay with your service; they are never shared.",
    fields: [
      ["kind", "string", "Short and lowercase, e.g. feedback, purchase, return, support."],
      ["summary", "string", "One line in plain words (max 280)."],
      ["data", "object", "Optional structured details."],
    ],
    example: `{ "kind": "feedback", "summary": "Said the sizing runs small" }`,
    response: `{ "environment": "sandbox", "event": { "id": "…", "kind": "feedback", "summary": "Said the sizing runs small", "created_at": "…" } }`,
    errors: ["consent_required", "customer_not_found", "invalid_request"],
  },
  {
    id: "context",
    method: "POST",
    path: "/api/v1/context",
    summary:
      "Call this before an interaction. Returns the preferences relevant to the request, why each one is relevant, where it came from, and a prompt block for an AI agent. Keep the context_id for the outcome.",
    fields: [
      ["customer_id", "string", "Your user id. Required."],
      ["purpose", "string", "\"ai_agent\" or \"personalization\". Required; checked against consent."],
      ["query", "string", "What the customer is asking for or looking at. Optional; without it, their strongest preferences come back."],
      ["categories", "string[]", "Optional. Only these categories."],
      ["limit", "number", "Optional, 1 to 50. Default 12."],
    ],
    example: `{ "customer_id": "cad_1042", "purpose": "ai_agent", "query": "jacket for riding to work in the rain" }`,
    response: `{
  "environment": "sandbox",
  "context_id": "cmg9…",
  "customer_id": "cad_1042",
  "purpose": "ai_agent",
  "query": "jacket for riding to work in the rain",
  "items": [
    {
      "category": "material", "value": "synthetic down", "stance": "AVOIDS", "source": "OBSERVED", "evidence": 2,
      "note": "returned twice: too warm",
      "from": { "service": "cadence", "name": "Cadence Outdoor", "shared": false },
      "why_relevant": ["material matters for \\"jacket\\""]
    },
    {
      "category": "color", "value": "muted earth tones", "stance": "LIKES", "source": "STATED", "evidence": 3, "note": null,
      "from": { "service": "fernhill", "name": "Fernhill Home", "shared": true },
      "why_relevant": ["colour matters for \\"jacket\\""]
    }
  ],
  "prompt": "What this customer has shared about their preferences (via Self):\\n- Avoids synthetic down (material; learned from 2 outcomes). Note: returned twice: too warm.\\n- …",
  "recent_events": [ { "kind": "return", "summary": "Returned a synthetic puffer: too warm for cycling", "created_at": "…" } ]
}`,
    errors: ["consent_required", "customer_not_found", "invalid_request"],
  },
  {
    id: "outcomes",
    method: "POST",
    path: "/api/v1/outcomes",
    summary:
      "What happened after the interaction. The response lists exactly what Self changed and why. Only your service's own preferences change; shared ones belong to the service they came from.",
    fields: [
      ["context_id", "string", "From the context call this outcome follows. Required."],
      ["result", "string", "purchased, accepted, returned, rejected or ignored."],
      ["item", "object", "{ name, attributes: [{ category, value }] }: what was suggested."],
      ["because", "array", "For returned or rejected: the attributes that didn't work. Without it, nothing is learned."],
      ["note", "string", "Optional, kept with the event."],
    ],
    example: `{
  "context_id": "cmg9…",
  "result": "returned",
  "item": { "name": "Harbor rain shell", "attributes": [
    { "category": "material", "value": "recycled nylon" },
    { "category": "color", "value": "bright yellow" }
  ] },
  "because": [{ "category": "color", "value": "bright yellow" }]
}`,
    response: `{
  "environment": "sandbox",
  "customer_id": "cad_1042",
  "result": "returned",
  "changes": [
    { "category": "color", "category_label": "Colour", "value": "bright yellow", "stance": "AVOIDS", "change": "added", "why": "returned an item with this" }
  ],
  "note": "1 preference updated."
}`,
    errors: ["consent_required", "context_not_found", "invalid_request"],
  },
  {
    id: "share-requests",
    method: "POST",
    path: "/api/v1/share-requests",
    summary:
      "Ask the customer to share part of what another participating service knows about them. Returns a consent_url to send the customer to. Nothing is shared until they approve there.",
    fields: [
      ["customer_id", "string", "Your user id. Required."],
      ["from_service", "string", "The other service's id, e.g. fernhill."],
      ["categories", "string[]", "What you'd like. The customer can approve fewer."],
      ["reason", "string", "Why, in words the customer will read."],
    ],
    example: `{ "customer_id": "cad_1042", "from_service": "fernhill", "categories": ["color", "style"], "reason": "To suggest things in colours you already like." }`,
    response: `{
  "environment": "sandbox",
  "id": "cmg9…",
  "status": "PENDING",
  "categories": ["color", "style"],
  "from_service": { "slug": "fernhill", "name": "Fernhill Home" },
  "consent_url": "${H}/sandbox/consent/cmg9…",
  "existing": false
}`,
    errors: ["consent_required", "customer_not_found", "service_not_found", "invalid_request"],
  },
  {
    id: "grants",
    method: "GET · DELETE",
    path: "/api/v1/share-grants/{id}",
    summary: "Read a grant's status, or end it. Either service in a grant can end it; the customer can too, from Self's consent screen.",
    response: `{ "environment": "sandbox", "id": "cmg9…", "status": "REVOKED", "categories": ["color"], "revoked_at": "…" }`,
    errors: ["grant_not_found", "grant_closed"],
  },
  {
    id: "delete-customer",
    method: "DELETE",
    path: "/api/v1/customers/{id}",
    summary: "Deletes everything your service holds about the customer: preferences, events, context history and share grants in both directions.",
    response: `{ "environment": "sandbox", "deleted": true, "id": "cad_5001" }`,
    errors: ["customer_not_found"],
  },
];

const ERRORS: Array<[string, number, string]> = [
  ["missing_key", 401, "No Authorization header."],
  ["invalid_key", 401, "Unknown key, or its sandbox expired."],
  ["invalid_json", 400, "The body isn't JSON."],
  ["invalid_request", 400, "A field is missing or malformed; the message names it."],
  ["consent_required", 403, "The customer hasn't allowed this purpose. Don't retry; respect it."],
  ["customer_not_found", 404, "No customer with that id is linked to your service."],
  ["context_not_found", 404, "The context_id isn't one your service received."],
  ["service_not_found", 404, "No participating service with that id."],
  ["grant_not_found", 404, "No share grant with that id involving your service."],
  ["grant_closed", 409, "The grant was already declined or revoked."],
  ["limit_reached", 429, "A sandbox limit was hit."],
  ["server_error", 500, "Something went wrong on Self's side."],
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-5 border-t border-border pt-12">
      <h2 className="text-2xl font-medium">{title}</h2>
      {children}
    </section>
  );
}

const P = ({ children }: { children: ReactNode }) => <p className="leading-relaxed text-fg-muted">{children}</p>;
const C = ({ children }: { children: ReactNode }) => <code className="rounded-sm bg-bg-inset px-1 py-0.5 font-mono text-[0.85em] text-fg">{children}</code>;

export default function Docs() {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-12 px-6 pt-6 pb-24 md:px-10 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Docs" className="hidden lg:block">
        <ul className="sticky top-8 flex flex-col gap-1.5 text-sm">
          {NAV.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} className="text-fg-muted hover:text-fg">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <article className="flex max-w-3xl min-w-0 flex-col gap-12">
        <header id="overview" className="flex scroll-mt-8 flex-col gap-5">
          <DemoLabel>Sandbox API · v1</DemoLabel>
          <h1 className="text-title">Integrating Self</h1>
          <P>
            Self keeps a structured, permissioned understanding of each of your customers and hands the relevant part to your
            product or AI agent when it&apos;s needed. You keep your own sign-in and your own customer relationship; Self sits
            behind them.
          </P>
          <P>
            Today Self runs as a sandbox: the API below is served by this site, against synthetic customers. Keys start with{" "}
            <C>self_test_</C>. There is no production environment yet, and nothing here should hold real customer data.
          </P>
        </header>

        <Section id="concepts" title="Concepts">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-[160px_1fr]">
            {[
              ["Service", "A participating company or product. It has its own API key and only ever sees its own customers."],
              ["Customer", "One person as your service knows them, keyed by your own user id. Two services never share a customer record."],
              ["Consent", "Per customer, per purpose: personalization, and use by AI agents. Checked on every call."],
              ["Preference", "A structured statement: likes or avoids a value in a category, stated by the customer or observed from outcomes, with how much evidence backs it."],
              ["Event", "A meaningful moment worth keeping: feedback, a purchase, a return. Events stay with the service that recorded them."],
              ["Context", "What Self returns before an interaction: the preferences relevant to this request, with reasons and sources."],
              ["Outcome", "What happened after. It's how understanding improves, and the response says exactly what changed."],
              ["Share grant", "A customer's permission for one service to read selected categories that another service holds."],
            ].map(([t, d]) => (
              <div key={t} className="contents">
                <dt className="font-medium">{t}</dt>
                <dd className="text-fg-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="quickstart" title="Quickstart">
          <P>
            <Link href="/sandbox" className="text-fg underline underline-offset-4">
              Open a sandbox
            </Link>{" "}
            and copy the key for Cadence Outdoor (&ldquo;Show key&rdquo;). Then, from a terminal:
          </P>
          <Code
            label="1 · Link a customer after your own sign-in"
            code={`export SELF_KEY=self_test_…

curl -X POST ${H}/api/v1/customers \\
  -H "Authorization: Bearer $SELF_KEY" -H "Content-Type: application/json" \\
  -d '{"id":"cad_5001","display_name":"Ada Brooks","consent":{"personalization":true,"ai_agents":true}}'`}
          />
          <Code
            label="2 · Record what the customer told you"
            code={`curl -X POST ${H}/api/v1/customers/cad_5001/preferences \\
  -H "Authorization: Bearer $SELF_KEY" -H "Content-Type: application/json" \\
  -d '{"preferences":[{"category":"fit","value":"shoe size EU 38","stance":"LIKES"},
                      {"category":"material","value":"leather","stance":"AVOIDS","note":"vegan"}]}'`}
          />
          <Code
            label="3 · Before your agent replies, retrieve context"
            code={`curl -X POST ${H}/api/v1/context \\
  -H "Authorization: Bearer $SELF_KEY" -H "Content-Type: application/json" \\
  -d '{"customer_id":"cad_5001","purpose":"ai_agent","query":"trail running shoes"}'`}
          />
          <P>
            Put <C>prompt</C> in your agent&apos;s instructions, or use <C>items</C> to filter and rank your own catalogue. Keep{" "}
            <C>context_id</C>.
          </P>
          <Code
            label="4 · After the customer acts, record the outcome"
            code={`curl -X POST ${H}/api/v1/outcomes \\
  -H "Authorization: Bearer $SELF_KEY" -H "Content-Type: application/json" \\
  -d '{"context_id":"<from step 3>","result":"purchased",
       "item":{"name":"Fell runner","attributes":[{"category":"use","value":"trail running"},{"category":"material","value":"recycled mesh"}]}}'`}
          />
          <P>The response lists each preference Self added or strengthened. The next context call reflects it.</P>
          <Code
            label="In your server code (TypeScript)"
            code={`const self = (path: string, body: object) =>
  fetch(\`\${process.env.SELF_URL}/api/v1\${path}\`, {
    method: "POST",
    headers: { Authorization: \`Bearer \${process.env.SELF_KEY}\`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const json = await r.json();
    if (!r.ok) throw Object.assign(new Error(json.error.message), { code: json.error.code });
    return json;
  });

export async function answer(user: { id: string }, message: string) {
  let context = "";
  let contextId: string | null = null;
  try {
    const ctx = await self("/context", { customer_id: user.id, purpose: "ai_agent", query: message });
    context = ctx.prompt;
    contextId = ctx.context_id;
  } catch (e) {
    // consent_required: answer without personal context. Never ask Self to bypass it.
    if ((e as { code?: string }).code !== "consent_required") throw e;
  }
  const reply = await yourAgent({ system: [basePrompt, context].filter(Boolean).join("\\n\\n"), message });
  return { reply, contextId }; // send contextId back with the outcome later
}`}
          />
        </Section>

        <Section id="auth" title="Authentication">
          <P>
            Every call except <C>GET /api/v1</C> needs a service key as a bearer token:{" "}
            <C>Authorization: Bearer self_test_…</C>. Each service has its own key and only ever sees its own customers. Keys
            are stored as hashes; Self can&apos;t show you one again.
          </P>
          <P>
            Call Self from your server, never from a browser or app bundle. (The sandbox console is the one exception: it holds
            sandbox keys so you can watch requests happen.)
          </P>
        </Section>

        <Section id="api" title="API reference">
          <P>
            JSON in, JSON out. Every response carries <C>&quot;environment&quot;: &quot;sandbox&quot;</C> and a{" "}
            <C>Self-Environment: sandbox</C> header. Customer ids in paths are your own user ids.
          </P>
          <div className="flex flex-col gap-12">
            {ENDPOINTS.map((e) => (
              <div key={e.id} id={e.id} className="flex scroll-mt-8 flex-col gap-4">
                <h3 className="flex flex-wrap items-baseline gap-3 font-mono text-sm">
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-2xs text-primary-fg">{e.method}</span>
                  <span>{e.path}</span>
                </h3>
                <P>{e.summary}</P>
                {e.fields && (
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-border">
                      {e.fields.map(([n, t, d]) => (
                        <tr key={n} className="align-top">
                          <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">{n}</td>
                          <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap text-fg-subtle">{t}</td>
                          <td className="py-2 text-fg-muted">{d}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {e.example && <Code label="Request body" code={e.example} />}
                <Code label="Response" code={e.response} />
                {e.errors && (
                  <p className="text-sm text-fg-subtle">
                    Errors: {e.errors.map((c, i) => (
                      <span key={c}>
                        {i > 0 && ", "}
                        <C>{c}</C>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section id="consent" title="Consent">
          <P>Each customer has two switches, set in your product and relayed to Self. The API enforces them on every call.</P>
          <table className="w-full text-left text-sm">
            <thead className="text-fg-subtle">
              <tr>
                <th className="py-2 pr-4 font-normal">Customer allowed</th>
                <th className="py-2 pr-4 font-normal">Record</th>
                <th className="py-2 pr-4 font-normal">Context for personalization</th>
                <th className="py-2 font-normal">Context for AI agents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-fg-muted">
              <tr>
                <td className="py-2 pr-4">Nothing</td>
                <td>No</td>
                <td>No</td>
                <td>No</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Personalization</td>
                <td>Yes</td>
                <td>Yes</td>
                <td>No</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Personalization and AI agents</td>
                <td>Yes</td>
                <td>Yes</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </table>
          <P>
            A refused call returns <C>403 consent_required</C>. Treat it as an answer, not an error to work around: carry on
            without personal context. Turning consent off stops all use straight away but keeps what was recorded, so turning it
            back on doesn&apos;t lose anything; to erase, call <C>DELETE /api/v1/customers/{"{id}"}</C>.
          </P>
        </Section>

        <Section id="sharing" title="Sharing across services">
          <P>
            The long-term aim is that a customer&apos;s understanding can follow them between the services they use. Self only
            does that with the customer&apos;s explicit permission, one grant at a time.
          </P>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-fg-muted">
            <li>
              Your service asks with <C>POST /api/v1/share-requests</C>, naming the other service, the categories and why.
            </li>
            <li>
              You send the customer to the <C>consent_url</C>. On Self&apos;s consent screen they sign in at the other service, so
              it confirms which account is theirs, and choose what to share.
            </li>
            <li>
              Once approved, context calls include the shared categories, each item marked <C>from.shared: true</C> with the
              source service&apos;s name.
            </li>
            <li>The customer, your service or the other service can end the grant at any time. The next context call won&apos;t include it.</li>
          </ol>
          <P>The rules, enforced by the API:</P>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-fg-muted">
            <li>A matching email, phone number or name is never used to connect profiles. Only an approved grant does.</li>
            <li>The customer can approve fewer categories than you asked for, never more.</li>
            <li>Shared preferences are read at request time and never copied into your service&apos;s profile.</li>
            <li>Your own preference wins when both services hold the same one. Outcomes only change your own.</li>
            <li>Events and history are never shared, only preferences in granted categories.</li>
            <li>The source customer&apos;s consent still applies: if they turn off AI agents there, shared items stop reaching AI agents here.</li>
          </ul>
        </Section>

        <Section id="learning" title="How outcomes teach">
          <P>
            Learning is deliberately simple and visible, so you can explain it to a customer. Every outcome response lists what
            changed.
          </P>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-fg-muted">
            <li>
              <C>purchased</C> or <C>accepted</C>: each item attribute becomes an observed like, or an existing like gains
              evidence. An observed avoid of the same thing weakens, and is removed when no evidence is left.
            </li>
            <li>
              <C>returned</C> or <C>rejected</C>: only the attributes in <C>because</C> count. With no reason, nothing is learned;
              a return can mean anything.
            </li>
            <li>
              <C>ignored</C>: recorded as an event, nothing learned.
            </li>
            <li>What the customer stated is never changed by an outcome. A conflict is reported as <C>kept</C>.</li>
          </ul>
        </Section>

        <Section id="categories" title="Categories">
          <P>
            Self starts with shopping and discovery. Preferences use these categories; values are short, plain phrases. The model
            (identities, consent, grants) isn&apos;t specific to shopping, so new kinds of services add a category set, not a new
            API.
          </P>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-border">
              {SHOPPING.categories.map((c) => (
                <tr key={c.key}>
                  <td className="py-2 pr-4 font-mono text-xs">{c.key}</td>
                  <td className="py-2 pr-4">{c.label}</td>
                  <td className="py-2 text-fg-muted">e.g. {c.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="errors" title="Errors">
          <P>
            Errors look like <C>{`{ "error": { "code": "consent_required", "message": "…" } }`}</C>. Codes are stable; messages are
            written to be read.
          </P>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-border">
              {ERRORS.map(([code, status, d]) => (
                <tr key={code}>
                  <td className="py-2 pr-4 font-mono text-xs">{code}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-fg-subtle">{status}</td>
                  <td className="py-2 text-fg-muted">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="sandbox" title="Sandbox limits">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-fg-muted">
            <li>A sandbox belongs to one browser and is deleted after {SANDBOX_DAYS} days. &ldquo;Reset to the start&rdquo; replaces it.</li>
            <li>Two fictional services, Cadence Outdoor and Fernhill Home, with synthetic customers. None of them exist.</li>
            <li>Up to 200 customers per service, 200 preferences and 500 events per customer.</li>
            <li>The consent screen simulates signing in at the source service; in production that step happens on the other service.</li>
            <li>Not for real customer data. There is no production environment or uptime commitment yet.</li>
          </ul>
        </Section>
      </article>
    </main>
  );
}
