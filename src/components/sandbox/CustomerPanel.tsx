"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { stopSharing } from "@/app/actions/sandbox";
import { cn } from "@/lib/cn";
import { SHOPPING, categoryLabel } from "@/lib/self/domains";
import type { Call } from "./SandboxConsole";
import type { ApiErrorBody, ContextOut, CustomerDetail, GrantOut, OutcomeOut, PrefOut, SandboxService } from "./types";

type Attr = { category: string; value: string };
const CATS = SHOPPING.categories;
const errorOf = (d: unknown) => (d as Partial<ApiErrorBody>)?.error;

/** One customer as the acting service sees them, with every API action around them. */
export function CustomerPanel({
  customer,
  service,
  services,
  call,
  refresh,
  onDeleted,
}: {
  customer: CustomerDetail;
  service: SandboxService;
  services: SandboxService[];
  call: Call;
  refresh: () => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const path = `/customers/${encodeURIComponent(customer.id)}`;
  const [context, setContext] = useState<ContextOut | null>(null);

  return (
    <div className="flex flex-col gap-5">
      {/* Who and consent */}
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-2xs tracking-[0.08em] text-fg-subtle uppercase">Synthetic customer</span>
            <h2 className="text-2xl font-medium">{customer.display_name ?? customer.id}</h2>
            <span className="font-mono text-xs text-fg-muted">
              {customer.id}
              {customer.email && ` · ${customer.email}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (!confirm(`Delete everything ${service.name} holds about ${customer.display_name ?? customer.id}?`)) return;
              const r = await call("DELETE", path);
              if (r.ok) await onDeleted();
            }}
          >
            Delete customer
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConsentRow
            label="Personalization"
            hint="Record preferences and use them in this service."
            checked={customer.consent.personalization}
            onChange={async (v) => (await call("PUT", `${path}/consent`, { personalization: v }), refresh())}
          />
          <ConsentRow
            label="AI agents"
            hint="Give this customer's context to AI agents."
            checked={customer.consent.ai_agents}
            onChange={async (v) => (await call("PUT", `${path}/consent`, { ai_agents: v }), refresh())}
          />
        </div>
        <p className="text-sm text-fg-subtle">
          In a real integration these switches live in your product&apos;s settings; your server relays the customer&apos;s choice.
        </p>
      </Card>

      <ContextSection customerId={customer.id} call={call} onResult={async (c) => (setContext(c), refresh())} />
      <OutcomeSection context={context} call={call} refresh={refresh} />
      <PreferencesSection prefs={customer.preferences} service={service} path={path} call={call} refresh={refresh} />
      <EventsSection events={customer.events} path={path} call={call} refresh={refresh} />
      <SharingSection customer={customer} service={service} services={services} call={call} refresh={refresh} />
    </div>
  );
}

function Section({ title, hint, children, aside }: { title: string; hint?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium">{title}</h3>
          {hint && <p className="max-w-xl text-sm text-fg-muted">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Card>
  );
}

function ConsentRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-bg-subtle px-4 py-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-fg-muted">{hint}</span>
      </div>
      <Switch label={label} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ErrorNote({ error }: { error?: { code: string; message: string } | null }) {
  if (!error) return null;
  return (
    <div className="rounded-lg bg-accent-soft px-4 py-3 text-sm">
      <span className="font-mono text-xs text-accent-text">{error.code}</span>
      <p className="text-fg">{error.message}</p>
    </div>
  );
}

// ── Context ──────────────────────────────────────────────────

function ContextSection({ customerId, call, onResult }: { customerId: string; call: Call; onResult: (c: ContextOut) => void }) {
  const [query, setQuery] = useState("jacket for riding to work in the rain");
  const [purpose, setPurpose] = useState("ai_agent");
  const [result, setResult] = useState<ContextOut | null>(null);
  const [error, setError] = useState<ApiErrorBody["error"] | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Section
      title="Before an interaction: retrieve context"
      hint="What your product or agent should know for this request. Each item says why it was included and where it came from."
    >
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await call<ContextOut>("POST", "/context", { customer_id: customerId, purpose, ...(query.trim() && { query: query.trim() }) });
          setBusy(false);
          if (r.ok) {
            setResult(r.data);
            setError(null);
            onResult(r.data);
          } else {
            setResult(null);
            setError(errorOf(r.data) ?? null);
          }
        }}
      >
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What is the customer asking for?" className="min-w-0 flex-1" />
        <Select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="sm:w-44! shrink-0" aria-label="Purpose">
          <option value="ai_agent">For an AI agent</option>
          <option value="personalization">For personalization</option>
        </Select>
        <Button type="submit" variant="primary" size="md" disabled={busy}>
          Get context
        </Button>
      </form>
      <ErrorNote error={error} />
      {result && (
        <div className="flex flex-col gap-4">
          {result.items.length === 0 ? (
            <p className="text-sm text-fg-muted">Nothing relevant is known yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {result.items.map((i) => (
                <li key={`${i.from.service}:${i.category}:${i.value}`} className="flex flex-col gap-1 py-2.5">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className={i.stance === "AVOIDS" ? "text-accent-text" : "text-fg-muted"}>{i.stance === "LIKES" ? "Likes" : "Avoids"}</span>
                    <span className="font-medium">{i.value}</span>
                    <span className="text-sm text-fg-subtle">{categoryLabel(i.category).toLowerCase()}</span>
                    {i.from.shared && <span className="rounded-full bg-bg-inset px-2 text-xs text-fg">shared from {i.from.name}</span>}
                  </span>
                  <span className="text-sm text-fg-muted">
                    {i.source === "STATED" ? "Said by the customer" : `Learned from ${i.evidence} outcome${i.evidence === 1 ? "" : "s"}`} · {i.why_relevant.join("; ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-fg-subtle">
              <code className="font-mono text-xs">prompt</code>: ready to put in your agent&apos;s instructions
            </span>
            <pre className="rounded-lg bg-bg-inset px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{result.prompt}</pre>
          </div>
        </div>
      )}
    </Section>
  );
}

// ── Outcomes ─────────────────────────────────────────────────

function AttrEditor({ attrs, onChange, addLabel }: { attrs: Attr[]; onChange: (a: Attr[]) => void; addLabel: string }) {
  return (
    <div className="flex flex-col gap-2">
      {attrs.map((a, i) => (
        <div key={i} className="flex gap-2">
          <Select value={a.category} onChange={(e) => onChange(attrs.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} className="w-40! shrink-0" aria-label="Category">
            {CATS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Select>
          <Input value={a.value} onChange={(e) => onChange(attrs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Value" className="min-w-0 flex-1" />
          <Button variant="ghost" size="md" iconOnly aria-label="Remove" onClick={() => onChange(attrs.filter((_, j) => j !== i))}>
            ×
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="self-start" onClick={() => onChange([...attrs, { category: "material", value: "" }])}>
        + {addLabel}
      </Button>
    </div>
  );
}

function OutcomeSection({ context, call, refresh }: { context: ContextOut | null; call: Call; refresh: () => Promise<void> }) {
  const [item, setItem] = useState("Harbor rain shell");
  const [attrs, setAttrs] = useState<Attr[]>([
    { category: "material", value: "recycled nylon" },
    { category: "color", value: "bright yellow" },
    { category: "use", value: "cycling" },
  ]);
  const [result, setResult] = useState("returned");
  const [because, setBecause] = useState<Attr[]>([{ category: "color", value: "bright yellow" }]);
  const [out, setOut] = useState<OutcomeOut | null>(null);
  const [error, setError] = useState<ApiErrorBody["error"] | null>(null);
  const negative = result === "returned" || result === "rejected";

  return (
    <Section
      title="After it: record the outcome"
      hint="Tell Self what happened with what you suggested. Purchases strengthen likes; a return or rejection only teaches something when you say why."
    >
      {!context ? (
        <p className="text-sm text-fg-muted">Retrieve context first. Outcomes point back at the context they followed.</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await call<OutcomeOut>("POST", "/outcomes", {
              context_id: context.context_id,
              result,
              item: { name: item.trim(), attributes: attrs.filter((a) => a.value.trim()) },
              ...(negative && { because: because.filter((a) => a.value.trim()) }),
            });
            if (r.ok) {
              setOut(r.data);
              setError(null);
              await refresh();
            } else setError(errorOf(r.data) ?? null);
          }}
        >
          <span className="font-mono text-2xs text-fg-subtle">context_id {context.context_id}</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item name" className="min-w-0 flex-1" required />
            <Select value={result} onChange={(e) => setResult(e.target.value)} className="sm:w-40! shrink-0" aria-label="Result">
              <option value="purchased">Purchased</option>
              <option value="accepted">Accepted</option>
              <option value="returned">Returned</option>
              <option value="rejected">Rejected</option>
              <option value="ignored">Ignored</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-fg-subtle">What the item was</span>
            <AttrEditor attrs={attrs} onChange={setAttrs} addLabel="Attribute" />
          </div>
          {negative && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-fg-subtle">Because (what didn&apos;t work)</span>
              <AttrEditor attrs={because} onChange={setBecause} addLabel="Reason" />
            </div>
          )}
          <Button type="submit" variant="primary" size="md" className="self-start">
            Record outcome
          </Button>
        </form>
      )}
      <ErrorNote error={error} />
      {out && (
        <div className="flex flex-col gap-2 rounded-lg bg-bg-subtle px-4 py-3">
          <span className="text-sm font-medium">What Self learned</span>
          {out.changes.length === 0 ? (
            <p className="text-sm text-fg-muted">{out.note}</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {out.changes.map((c) => (
                <li key={`${c.category}:${c.value}`}>
                  <span className="font-medium capitalize">{c.change}</span>{" "}
                  <span className="text-fg-muted">
                    {c.stance === "LIKES" ? "likes" : "avoids"} {c.value} ({c.category_label.toLowerCase()}): {c.why}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}

// ── Preferences ──────────────────────────────────────────────

function PreferencesSection({ prefs, service, path, call, refresh }: { prefs: PrefOut[]; service: SandboxService; path: string; call: Call; refresh: () => Promise<void> }) {
  const [category, setCategory] = useState("style");
  const [value, setValue] = useState("");
  const [stance, setStance] = useState("LIKES");
  const [error, setError] = useState<ApiErrorBody["error"] | null>(null);
  const groups = CATS.map((c) => ({ c, items: prefs.filter((p) => p.category === c.key) })).filter((g) => g.items.length);

  return (
    <Section title={`What ${service.name} knows`} hint="Structured preferences. Stated ones come from the customer; observed ones from outcomes, with how many back them.">
      {groups.length === 0 ? (
        <p className="text-sm text-fg-muted">Nothing yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {groups.map(({ c, items }) => (
            <div key={c.key} className="flex flex-col gap-1.5">
              <span className="text-sm text-fg-subtle">{c.label}</span>
              <ul className="flex flex-col gap-1">
                {items.map((p) => (
                  <li key={p.value} className="group flex items-start justify-between gap-2">
                    <span className="text-sm">
                      <span className={p.stance === "AVOIDS" ? "text-accent-text" : "text-fg-muted"}>{p.stance === "LIKES" ? "Likes" : "Avoids"}</span> {p.value}
                      <span className="ml-1.5 font-mono text-2xs text-fg-subtle">
                        {p.source === "STATED" ? "stated" : "observed"} ×{p.evidence}
                      </span>
                    </span>
                    <button
                      className="text-xs text-fg-subtle opacity-0 group-hover:opacity-100 hover:text-fg focus-visible:opacity-100"
                      onClick={async () => {
                        const r = await call("POST", `${path}/preferences`, { forget: [{ category: p.category, value: p.value }] });
                        setError(r.ok ? null : (errorOf(r.data) ?? null));
                        await refresh();
                      }}
                    >
                      Forget
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <form
        className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await call("POST", `${path}/preferences`, { preferences: [{ category, value: value.trim(), stance }] });
          if (r.ok) {
            setValue("");
            setError(null);
            await refresh();
          } else setError(errorOf(r.data) ?? null);
        }}
      >
        <Select value={stance} onChange={(e) => setStance(e.target.value)} className="sm:w-28! shrink-0" aria-label="Stance">
          <option value="LIKES">Likes</option>
          <option value="AVOIDS">Avoids</option>
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-40! shrink-0" aria-label="Category">
          {CATS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={CATS.find((c) => c.key === category)?.example} className="min-w-0 flex-1" required />
        <Button type="submit" variant="secondary" size="md">
          Customer said this
        </Button>
      </form>
      <ErrorNote error={error} />
    </Section>
  );
}

// ── Events ───────────────────────────────────────────────────

function EventsSection({ events, path, call, refresh }: { events: CustomerDetail["events"]; path: string; call: Call; refresh: () => Promise<void> }) {
  const [kind, setKind] = useState("feedback");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<ApiErrorBody["error"] | null>(null);
  return (
    <Section title="Feedback and history" hint="Meaningful moments, kept with the service that recorded them. Events are never shared with other services.">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await call("POST", `${path}/events`, { kind, summary: summary.trim() });
          if (r.ok) {
            setSummary("");
            setError(null);
            await refresh();
          } else setError(errorOf(r.data) ?? null);
        }}
      >
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="sm:w-36! shrink-0" aria-label="Kind">
          {["feedback", "purchase", "return", "support"].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
        <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Said the sizing runs small" className="min-w-0 flex-1" required />
        <Button type="submit" variant="secondary" size="md">
          Record
        </Button>
      </form>
      <ErrorNote error={error} />
      <ul className="flex flex-col gap-1.5">
        {events.slice(0, 8).map((e) => (
          <li key={e.id} className="flex gap-3 text-sm">
            <span className="w-28 shrink-0 font-mono text-2xs leading-5 text-fg-subtle">{e.kind}</span>
            <span className="min-w-0 flex-1">{e.summary}</span>
            <span className="shrink-0 text-xs text-fg-subtle">{new Date(e.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ── Sharing ──────────────────────────────────────────────────

const STATUS_TEXT: Record<GrantOut["status"], string> = { PENDING: "Waiting on the customer", ACTIVE: "Sharing", DECLINED: "Declined", REVOKED: "Stopped" };

function SharingSection({
  customer,
  service,
  services,
  call,
  refresh,
}: {
  customer: CustomerDetail;
  service: SandboxService;
  services: SandboxService[];
  call: Call;
  refresh: () => Promise<void>;
}) {
  const others = services.filter((s) => s.slug !== service.slug);
  const [from, setFrom] = useState(others[0]?.slug ?? "");
  const [cats, setCats] = useState<string[]>(["color", "style"]);
  const [reason, setReason] = useState("To suggest things in colours and styles you already like.");
  const [error, setError] = useState<ApiErrorBody["error"] | null>(null);
  const grants = [...customer.sharing.incoming.map((g) => ({ ...g, dir: "in" as const })), ...customer.sharing.outgoing.map((g) => ({ ...g, dir: "out" as const }))];

  return (
    <Section
      title="Sharing across services"
      hint={
        <>
          {customer.display_name ?? "This customer"} may use other participating services. A matching email doesn&apos;t connect them: {service.name} has to ask, and
          the customer decides.
        </>
      }
    >
      {grants.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {grants.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span className="text-sm">
                {g.dir === "in" ? `From ${g.from_service?.name}` : `To ${g.to_service?.name}`}: {g.categories.map((c) => categoryLabel(c).toLowerCase()).join(", ")}
              </span>
              <span className={cn("text-xs", g.status === "PENDING" ? "text-accent-text" : "text-fg-subtle")}>{STATUS_TEXT[g.status]}</span>
              <span className="ml-auto flex gap-1">
                {g.status === "PENDING" && g.dir === "in" && (
                  <Link href={`/sandbox/consent/${g.id}`} className="rounded-full px-3 py-1 text-sm font-medium hover:bg-bg-hover">
                    Open as the customer
                  </Link>
                )}
                {(g.status === "PENDING" || g.status === "ACTIVE") && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={async () => {
                      await call("DELETE", `/share-grants/${g.id}`);
                      await refresh();
                    }}
                  >
                    End (as {service.name})
                  </Button>
                )}
                {g.status === "ACTIVE" && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={async () => {
                      await stopSharing(g.id);
                      await refresh();
                    }}
                  >
                    Stop (as the customer)
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <form
          className="flex flex-col gap-3 border-t border-border pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await call("POST", "/share-requests", { customer_id: customer.id, from_service: from, categories: cats, reason: reason.trim() });
            if (r.ok) {
              setError(null);
              await refresh();
            } else setError(errorOf(r.data) ?? null);
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm text-fg-muted">Ask to receive from</span>
            <Select value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-48! shrink-0" aria-label="Source service">
              {others.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATS.map((c) => {
              const on = cats.includes(c.key);
              return (
                <button
                  type="button"
                  key={c.key}
                  aria-pressed={on}
                  onClick={() => setCats(on ? cats.filter((x) => x !== c.key) : [...cats, c.key])}
                  className={cn("h-7 rounded-full px-3 text-sm transition-colors", on ? "bg-primary text-primary-fg" : "bg-bg-inset text-fg-muted hover:text-fg")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why, in words the customer will see" required />
          <Button type="submit" variant="secondary" size="md" className="self-start" disabled={!cats.length}>
            Request sharing
          </Button>
        </form>
      )}
      <ErrorNote error={error} />
    </Section>
  );
}
