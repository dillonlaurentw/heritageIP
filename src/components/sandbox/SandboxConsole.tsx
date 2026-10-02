"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { CustomerPanel } from "./CustomerPanel";
import { RequestLog } from "./RequestLog";
import type { AuditRow, CustomerDetail, CustomerRow, LogEntry, SandboxService } from "./types";

export type Call = <T = unknown>(method: string, path: string, body?: unknown) => Promise<{ ok: boolean; status: number; data: T }>;

/**
 * The developer sandbox. Every action here is a real request to the local
 * Self API with the selected service's sandbox key; the right column shows
 * each request and response as it happened.
 */
export function SandboxConsole({ services, daysLeft: days, audit }: { services: SandboxService[]; daysLeft: number; audit: AuditRow[] }) {
  const router = useRouter();
  const [slug, setSlug] = useState(services[0]?.slug ?? "");
  const service = services.find((s) => s.slug === slug) ?? services[0];
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const seq = useRef(0);

  const call: Call = useCallback(
    async (method, path, body) => {
      const started = performance.now();
      const res = await fetch(`/api/v1${path}`, {
        method,
        headers: { Authorization: `Bearer ${service.key}`, ...(body !== undefined && { "Content-Type": "application/json" }) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      const entry: LogEntry = {
        id: ++seq.current,
        method,
        path: `/api/v1${path}`,
        body,
        status: res.status,
        ms: Math.round(performance.now() - started),
        response: data,
        service: service.slug,
      };
      setLog((l) => [entry, ...l].slice(0, 60));
      return { ok: res.ok, status: res.status, data };
    },
    [service],
  );

  const loadCustomers = useCallback(async () => {
    const r = await call<{ customers: CustomerRow[] }>("GET", "/customers");
    if (r.ok) setCustomers(r.data.customers);
    return r.ok ? r.data.customers : [];
  }, [call]);

  const loadDetail = useCallback(
    async (id: string) => {
      const r = await call<CustomerDetail>("GET", `/customers/${encodeURIComponent(id)}`);
      setDetail(r.ok ? r.data : null);
    },
    [call],
  );

  /** After any change: refresh the list, the open customer and the server-side activity log. */
  const refresh = useCallback(async () => {
    await loadCustomers();
    if (selected) await loadDetail(selected);
    router.refresh();
  }, [loadCustomers, loadDetail, selected, router]);

  // Switching service loads its customers and opens the first one.
  useEffect(() => {
    let live = true;
    (async () => {
      const list = await loadCustomers();
      if (!live) return;
      const first = list[0]?.id ?? null;
      setSelected(first);
      if (first) await loadDetail(first);
      else setDetail(null);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const open = async (id: string) => {
    setSelected(id);
    await loadDetail(id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl">Developer sandbox</h1>
          <p className="max-w-2xl text-fg-muted">
            Two fictional services and their synthetic customers. Everything you do here calls the local Self API with a
            sandbox key; nothing is a real person or a live integration. Expires in {days} day{days === 1 ? "" : "s"}.
          </p>
        </div>
        <div role="tablist" aria-label="Acting as" className="flex shrink-0 gap-1 rounded-full bg-bg-inset p-1">
          {services.map((s) => (
            <button
              key={s.slug}
              role="tab"
              aria-selected={s.slug === slug}
              onClick={() => setSlug(s.slug)}
              className={cn(
                "h-8 rounded-full px-4 text-sm font-medium transition-colors",
                s.slug === slug ? "bg-surface text-fg shadow-card" : "text-fg-muted hover:text-fg",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <Walkthrough services={services} setSlug={setSlug} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[230px_minmax(0,1fr)_400px]">
        {/* Customers */}
        <div className="flex flex-col gap-3">
          <Card className="flex flex-col gap-1 p-4">
            <span className="text-sm text-fg-subtle">Acting as</span>
            <span className="font-medium">{service.name}</span>
            <span className="text-sm text-fg-muted">{service.description}</span>
            <KeyReveal value={service.key} hint={service.keyHint} />
          </Card>
          <Card className="flex flex-col p-2">
            <span className="px-2 pt-1 pb-2 text-sm text-fg-subtle">Customers</span>
            <ul className="flex flex-col gap-0.5">
              {customers.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => open(c.id)}
                    className={cn(
                      "flex w-full flex-col items-start rounded-md px-2.5 py-2 text-left transition-colors",
                      c.id === selected ? "bg-bg-active" : "hover:bg-bg-hover",
                    )}
                  >
                    <span className="text-sm font-medium">{c.display_name ?? c.id}</span>
                    <span className="font-mono text-2xs text-fg-subtle">
                      {c.id} · {c.preference_count} pref{c.preference_count === 1 ? "" : "s"}
                      {!c.consent.personalization && " · no consent"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <LinkCustomer call={call} onDone={async (id) => (await loadCustomers(), open(id), router.refresh())} />
          </Card>
        </div>

        {/* The open customer */}
        <div className="min-w-0">
          {detail ? (
            <CustomerPanel
              key={`${slug}:${detail.id}`}
              customer={detail}
              service={service}
              services={services}
              call={call}
              refresh={refresh}
              onDeleted={async () => {
                const list = await loadCustomers();
                const next = list[0]?.id ?? null;
                setSelected(next);
                if (next) await loadDetail(next);
                else setDetail(null);
                router.refresh();
              }}
            />
          ) : (
            <Card className="p-8 text-fg-muted">Pick a customer, or link a new one.</Card>
          )}
        </div>

        {/* Requests and the activity log */}
        <RequestLog log={log} audit={audit} keys={Object.fromEntries(services.map((s) => [s.slug, s.key]))} />
      </div>
    </div>
  );
}

function LinkCustomer({ call, onDone }: { call: Call; onDone: (id: string) => void }) {
  const [openForm, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!openForm)
    return (
      <Button variant="ghost" size="sm" className="mt-1 justify-start" onClick={() => setOpen(true)}>
        + Link a customer
      </Button>
    );

  return (
    <form
      className="mt-2 flex flex-col gap-2 border-t border-border px-1 pt-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await call<{ customer: { id: string } } & { error?: { message: string } }>("POST", "/customers", {
          id: id.trim(),
          ...(name.trim() && { display_name: name.trim() }),
          consent: { personalization: consent, ai_agents: consent },
        });
        if (!r.ok) return setError(r.data.error?.message ?? "That didn't work.");
        setOpen(false);
        setId("");
        setName("");
        setError(null);
        onDone(r.data.customer.id);
      }}
    >
      <Input placeholder="Your user id, e.g. cad_5001" value={id} onChange={(e) => setId(e.target.value)} required />
      <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-fg-muted">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="accent-(--primary)" />
        Customer allowed personalization and AI agents
      </label>
      {error && <span className="text-xs text-danger">{error}</span>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm">
          Link
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** A short guided path through the sandbox. Each step says what to do; the panels do it. */
function Walkthrough({ services, setSlug }: { services: SandboxService[]; setSlug: (s: string) => void }) {
  const [hidden, setHidden] = useState(false);
  const other = services[1]?.name ?? "the other service";
  if (hidden)
    return (
      <button className="self-start text-sm text-fg-muted hover:text-fg" onClick={() => setHidden(false)}>
        Show the walkthrough
      </button>
    );
  const steps = [
    { t: "Retrieve context", b: `As ${services[0]?.name}, open Maya and ask for context for "jacket for riding to work in the rain".` },
    { t: "Record the outcome", b: "Report that she returned it because of a colour or material. Self lists exactly what it learned." },
    { t: "Ask to share", b: `Request colour and style from ${other}. Approve it as Maya on the consent screen, then retrieve context again.` },
    { t: "Hit a consent wall", b: "Open Theo and ask for AI agent context. He hasn't allowed it, so the API refuses with consent_required." },
  ];
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-fg-subtle">Try this</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={() => setSlug(services[0]?.slug ?? "")}>
            Start as {services[0]?.name}
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setHidden(true)}>
            Hide
          </Button>
        </div>
      </div>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t} className="flex flex-col gap-1">
            <span className="font-mono text-2xs text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-sm font-medium">{s.t}</span>
            <span className="text-sm text-fg-muted">{s.b}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** The sandbox key, hidden until asked for, so it can be used from a terminal. */
function KeyReveal({ value, hint }: { value: string; hint: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="mt-2 flex flex-col gap-1">
      <span className="font-mono text-2xs break-all text-fg-subtle" title="Sandbox key, sent as a bearer token">
        {shown ? value : `self_test_…${hint}`}
      </span>
      <span className="flex gap-3 text-xs">
        <button className="text-fg-muted hover:text-fg" onClick={() => setShown(!shown)}>
          {shown ? "Hide key" : "Show key"}
        </button>
        <button className="text-fg-muted hover:text-fg" onClick={() => void navigator.clipboard?.writeText(value)}>
          Copy
        </button>
      </span>
    </div>
  );
}
