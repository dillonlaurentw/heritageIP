import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { CustomerProfile, Preference, SelfService } from "@/generated/prisma/client";
import { categoryLabel } from "./domains";
import {
  applyStated,
  approvedCategories,
  consentProblem,
  contextLines,
  learnFromOutcome,
  mayDecide,
  mayRevoke,
  mergeWithShared,
  normalizeValue,
  rankContext,
  sharedPrefs,
  type Attr,
  type ContextItem,
  type GrantStatus,
  type Origin,
  type OutcomeResult,
  type Pref,
  type PrefWrite,
  type Purpose,
  type Stance,
} from "./rules";
import { SANDBOX_DAYS, SEED_SERVICES } from "./sandbox-data";

/**
 * The Self platform's server logic. Every function that touches a customer
 * takes the calling service and only ever finds profiles that belong to it.
 * Route handlers in src/app/api/v1 validate input and call these.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export type Service = Pick<SelfService, "id" | "sandboxId" | "slug" | "name">;

const LIMITS = { customersPerService: 200, prefsPerCustomer: 200, eventsPerCustomer: 500 };

// ── Keys and sandboxes ───────────────────────────────────────

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");
const newKey = () => `self_test_${randomBytes(24).toString("base64url")}`;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

/** The service an API key belongs to, if its sandbox hasn't expired. */
export async function serviceForKey(key: string): Promise<Service | null> {
  const s = await db.selfService.findUnique({
    where: { keyHash: hashKey(key) },
    select: { id: true, sandboxId: true, slug: true, name: true, sandbox: { select: { expiresAt: true } } },
  });
  if (!s || s.sandbox.expiresAt < new Date()) return null;
  return { id: s.id, sandboxId: s.sandboxId, slug: s.slug, name: s.name };
}

/** A fresh sandbox with the synthetic services and customers. Returns the raw keys once. */
export async function createSandbox(): Promise<{ id: string; keys: Record<string, string> }> {
  await db.sandbox.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const sandbox = await db.sandbox.create({ data: { expiresAt: new Date(Date.now() + SANDBOX_DAYS * 86_400_000) } });
  const keys: Record<string, string> = {};
  for (const s of SEED_SERVICES) {
    const key = newKey();
    keys[s.slug] = key;
    const service = await db.selfService.create({
      data: { sandboxId: sandbox.id, slug: s.slug, name: s.name, description: s.description, keyHash: hashKey(key), keyHint: key.slice(-4) },
    });
    for (const c of s.customers) {
      await db.customerProfile.create({
        data: {
          serviceId: service.id,
          externalId: c.externalId,
          displayName: c.displayName,
          email: c.email,
          consentPersonalization: c.consent.personalization,
          consentAgents: c.consent.agents,
          consentUpdatedAt: daysAgo(60),
          createdAt: daysAgo(60),
          preferences: {
            create: c.prefs.map((p) => ({
              category: p.category,
              value: p.value,
              stance: p.stance,
              source: p.source,
              evidence: p.evidence,
              note: p.note,
              lastEvidenceAt: daysAgo(p.daysAgo),
              createdAt: daysAgo(p.daysAgo + 5),
            })),
          },
          events: { create: c.events.map((e) => ({ kind: e.kind, summary: e.summary, data: e.data as object | undefined, createdAt: daysAgo(e.daysAgo) })) },
        },
      });
    }
  }
  await audit(sandbox.id, "self", null, "sandbox.created", "Sandbox created with synthetic customers.");
  return { id: sandbox.id, keys };
}

/** Confirms a sandbox from the browser cookie is still there and the keys are its own. */
export async function verifySandbox(id: string, keys: Record<string, string>) {
  const sandbox = await db.sandbox.findUnique({
    where: { id },
    select: { id: true, expiresAt: true, services: { select: { id: true, slug: true, name: true, description: true, keyHash: true, keyHint: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!sandbox || sandbox.expiresAt < new Date()) return null;
  const ok = sandbox.services.every((s) => keys[s.slug] && hashKey(keys[s.slug]) === s.keyHash);
  if (!ok) return null;
  return {
    id: sandbox.id,
    expiresAt: sandbox.expiresAt,
    services: sandbox.services.map((s) => ({ slug: s.slug, name: s.name, description: s.description, keyHint: s.keyHint, key: keys[s.slug] })),
  };
}

export async function deleteSandbox(id: string) {
  await db.sandbox.deleteMany({ where: { id } });
}

// ── Audit ────────────────────────────────────────────────────

async function audit(sandboxId: string, actor: string, profileId: string | null, action: string, detail: string) {
  await db.selfAuditEntry.create({ data: { sandboxId, actor, profileId, action, detail } });
}

// ── Customers ────────────────────────────────────────────────

async function findProfile(service: Service, externalId: string) {
  const p = await db.customerProfile.findUnique({ where: { serviceId_externalId: { serviceId: service.id, externalId } } });
  if (!p) throw new ApiError(404, "customer_not_found", `No customer "${externalId}" is linked to ${service.name}. Link them first with POST /api/v1/customers.`);
  return p;
}

const consentOf = (p: CustomerProfile) => ({ personalization: p.consentPersonalization, agents: p.consentAgents });

function requireConsent(p: CustomerProfile, purpose: Purpose | "record") {
  const problem = consentProblem(consentOf(p), purpose);
  if (problem) throw new ApiError(403, "consent_required", problem);
}

const prefOut = (p: Preference) => ({
  category: p.category,
  value: p.value,
  stance: p.stance,
  source: p.source,
  evidence: p.evidence,
  note: p.note,
  last_evidence_at: p.lastEvidenceAt.toISOString(),
});

const customerSummary = (p: CustomerProfile) => ({
  id: p.externalId,
  display_name: p.displayName,
  email: p.email,
  consent: { personalization: p.consentPersonalization, ai_agents: p.consentAgents, updated_at: p.consentUpdatedAt?.toISOString() ?? null },
  created_at: p.createdAt.toISOString(),
});

/**
 * Links a customer from the service's own sign-in. Idempotent on the
 * service's user id. Never looks at other services, even with the same email.
 */
export async function linkCustomer(
  service: Service,
  input: { id: string; display_name?: string; email?: string; consent?: { personalization?: boolean; ai_agents?: boolean } },
) {
  const existing = await db.customerProfile.findUnique({ where: { serviceId_externalId: { serviceId: service.id, externalId: input.id } } });
  if (!existing && (await db.customerProfile.count({ where: { serviceId: service.id } })) >= LIMITS.customersPerService)
    throw new ApiError(429, "limit_reached", `A sandbox service can hold ${LIMITS.customersPerService} customers.`);
  const consentData =
    input.consent === undefined
      ? {}
      : {
          ...(input.consent.personalization !== undefined && { consentPersonalization: input.consent.personalization }),
          ...(input.consent.ai_agents !== undefined && { consentAgents: input.consent.ai_agents }),
          consentUpdatedAt: new Date(),
        };
  const p = await db.customerProfile.upsert({
    where: { serviceId_externalId: { serviceId: service.id, externalId: input.id } },
    create: { serviceId: service.id, externalId: input.id, displayName: input.display_name, email: input.email, ...consentData },
    update: { ...(input.display_name !== undefined && { displayName: input.display_name }), ...(input.email !== undefined && { email: input.email }), ...consentData },
  });
  await audit(service.sandboxId, service.slug, p.id, existing ? "customer.updated" : "customer.linked", existing ? "Updated the linked customer." : `Linked customer ${p.externalId}.`);
  return { created: !existing, customer: customerSummary(p) };
}

export async function listCustomers(service: Service) {
  const rows = await db.customerProfile.findMany({
    where: { serviceId: service.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { preferences: true } } },
  });
  return rows.map((p) => ({ ...customerSummary(p), preference_count: p._count.preferences }));
}

/** Everything this service holds about one customer, plus who it shares with. */
export async function getCustomer(service: Service, externalId: string) {
  const p = await findProfile(service, externalId);
  const [preferences, events, incoming, outgoing] = await Promise.all([
    db.preference.findMany({ where: { profileId: p.id }, orderBy: [{ category: "asc" }, { evidence: "desc" }] }),
    db.customerEvent.findMany({ where: { profileId: p.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.shareGrant.findMany({ where: { toProfileId: p.id }, orderBy: { createdAt: "desc" }, include: { sourceService: { select: { slug: true, name: true } } } }),
    db.shareGrant.findMany({ where: { fromProfileId: p.id }, orderBy: { createdAt: "desc" }, include: { toProfile: { select: { service: { select: { slug: true, name: true } } } } } }),
  ]);
  return {
    ...customerSummary(p),
    preferences: preferences.map(prefOut),
    events: events.map((e) => ({ id: e.id, kind: e.kind, summary: e.summary, data: e.data, context_id: e.contextId, created_at: e.createdAt.toISOString() })),
    sharing: {
      incoming: incoming.map((g) => ({ ...grantOut(g), from_service: g.sourceService })),
      outgoing: outgoing.map((g) => ({ ...grantOut(g), to_service: g.toProfile.service })),
    },
  };
}

export async function setConsent(service: Service, externalId: string, c: { personalization?: boolean; ai_agents?: boolean }) {
  const p = await findProfile(service, externalId);
  const next = await db.customerProfile.update({
    where: { id: p.id },
    data: {
      ...(c.personalization !== undefined && { consentPersonalization: c.personalization }),
      ...(c.ai_agents !== undefined && { consentAgents: c.ai_agents }),
      consentUpdatedAt: new Date(),
    },
  });
  await audit(
    service.sandboxId,
    service.slug,
    p.id,
    "consent.updated",
    `Personalization ${next.consentPersonalization ? "on" : "off"}, AI agents ${next.consentAgents ? "on" : "off"}.`,
  );
  return customerSummary(next).consent;
}

/** Deletes everything this service holds about the customer, including share grants. */
export async function deleteCustomer(service: Service, externalId: string) {
  const p = await findProfile(service, externalId);
  await db.customerProfile.delete({ where: { id: p.id } });
  await audit(service.sandboxId, service.slug, p.id, "customer.deleted", `Deleted customer ${externalId} and everything recorded about them.`);
  return { deleted: true, id: externalId };
}

// ── Preferences and events ───────────────────────────────────

const toPref = (p: Preference): Pref => ({
  category: p.category,
  value: p.value,
  stance: p.stance,
  source: p.source,
  evidence: p.evidence,
  lastEvidenceAt: p.lastEvidenceAt,
  note: p.note,
});

async function applyWrites(profileId: string, writes: PrefWrite[]) {
  for (const w of writes) {
    const where = { profileId_category_value: { profileId, category: w.category, value: w.value } };
    if (w.op === "delete") {
      await db.preference.deleteMany({ where: { profileId, category: w.category, value: w.value } });
      continue;
    }
    const data = { stance: w.stance, source: w.source, evidence: w.evidence, note: w.note ?? null, lastEvidenceAt: new Date() };
    await db.preference.upsert({ where, create: { profileId, category: w.category, value: w.value, ...data }, update: data });
  }
}

export async function statePreferences(
  service: Service,
  externalId: string,
  input: { preferences: Array<{ category: string; value: string; stance: Stance; note?: string }>; forget: Attr[] },
) {
  const p = await findProfile(service, externalId);
  requireConsent(p, "record");
  const existing = (await db.preference.findMany({ where: { profileId: p.id } })).map(toPref);
  if (existing.length + input.preferences.length > LIMITS.prefsPerCustomer)
    throw new ApiError(429, "limit_reached", `A sandbox customer can hold ${LIMITS.prefsPerCustomer} preferences.`);
  const writes: PrefWrite[] = [
    ...input.preferences.map((s) => applyStated(existing.find((e) => e.category === s.category && e.value === normalizeValue(s.value)), s)),
    ...input.forget.map((f) => ({ op: "delete" as const, category: f.category, value: normalizeValue(f.value) })),
  ];
  await applyWrites(p.id, writes);
  const said = input.preferences.map((s) => `${s.stance === "LIKES" ? "likes" : "avoids"} ${normalizeValue(s.value)}`);
  const forgot = input.forget.map((f) => `forgot ${normalizeValue(f.value)}`);
  await audit(service.sandboxId, service.slug, p.id, "preferences.stated", [...said, ...forgot].join("; ") || "No change.");
  const prefs = await db.preference.findMany({ where: { profileId: p.id }, orderBy: [{ category: "asc" }, { evidence: "desc" }] });
  return { preferences: prefs.map(prefOut) };
}

export async function recordEvent(service: Service, externalId: string, input: { kind: string; summary: string; data?: Record<string, unknown> }) {
  const p = await findProfile(service, externalId);
  requireConsent(p, "record");
  if ((await db.customerEvent.count({ where: { profileId: p.id } })) >= LIMITS.eventsPerCustomer)
    throw new ApiError(429, "limit_reached", `A sandbox customer can hold ${LIMITS.eventsPerCustomer} events.`);
  const e = await db.customerEvent.create({ data: { profileId: p.id, kind: input.kind, summary: input.summary, data: input.data as object | undefined } });
  await audit(service.sandboxId, service.slug, p.id, "event.recorded", `${input.kind}: ${input.summary}`);
  return { id: e.id, kind: e.kind, summary: e.summary, created_at: e.createdAt.toISOString() };
}

// ── Context ──────────────────────────────────────────────────

const itemOut = (i: ContextItem) => ({
  category: i.category,
  value: i.value,
  stance: i.stance,
  source: i.source,
  evidence: i.evidence,
  note: i.note ?? null,
  from: { service: i.origin.service, name: i.origin.serviceName, shared: i.origin.shared },
  why_relevant: i.reasons,
});

/**
 * Context before an interaction: the preferences that matter for `query`,
 * from this service plus any active share grants (granted categories only).
 * Logged as a ContextRequest so the outcome can point back to it.
 */
export async function getContext(
  service: Service,
  input: { customer_id: string; purpose: Purpose; query?: string; categories?: string[]; limit?: number },
) {
  const p = await findProfile(service, input.customer_id);
  requireConsent(p, input.purpose);

  const own = (await db.preference.findMany({ where: { profileId: p.id } })).map((x) => ({
    ...toPref(x),
    origin: { service: service.slug, serviceName: service.name, shared: false } as Origin,
  }));

  const grants = await db.shareGrant.findMany({
    where: { toProfileId: p.id, status: "ACTIVE", fromProfileId: { not: null } },
    include: { sourceService: { select: { slug: true, name: true } }, fromProfile: { include: { preferences: true } } },
  });
  const shared = grants.flatMap((g) => {
    // The source customer's own consent still applies to what leaves that service.
    if (!g.fromProfile || !g.fromProfile.consentPersonalization) return [];
    if (input.purpose === "ai_agent" && !g.fromProfile.consentAgents) return [];
    return sharedPrefs({ status: g.status as GrantStatus, categories: g.categories }, g.fromProfile.preferences).map((x) => ({
      ...toPref(x),
      origin: { service: g.sourceService.slug, serviceName: g.sourceService.name, shared: true } as Origin,
    }));
  });

  const items = rankContext({ query: input.query, prefs: mergeWithShared(own, shared), categories: input.categories, limit: input.limit });
  const lines = contextLines(items);
  const recent = await db.customerEvent.findMany({ where: { profileId: p.id }, orderBy: { createdAt: "desc" }, take: 3 });

  const ctx = await db.contextRequest.create({
    data: {
      serviceId: service.id,
      profileId: p.id,
      purpose: input.purpose,
      query: input.query ?? null,
      returned: items.map((i) => ({ category: i.category, value: i.value, from: i.origin.service })),
    },
  });
  const sharedCount = items.filter((i) => i.origin.shared).length;
  await audit(
    service.sandboxId,
    service.slug,
    p.id,
    "context.read",
    `Read ${items.length} item${items.length === 1 ? "" : "s"} for ${input.purpose === "ai_agent" ? "an AI agent" : "personalization"}${input.query ? ` ("${input.query}")` : ""}${sharedCount ? `, ${sharedCount} shared with permission` : ""}.`,
  );

  return {
    context_id: ctx.id,
    customer_id: p.externalId,
    purpose: input.purpose,
    query: input.query ?? null,
    items: items.map(itemOut),
    prompt:
      items.length === 0
        ? "Nothing relevant is known about this customer yet."
        : `What this customer has shared about their preferences (via Self):\n${lines.map((l) => `- ${l}`).join("\n")}`,
    recent_events: recent.map((e) => ({ kind: e.kind, summary: e.summary, created_at: e.createdAt.toISOString() })),
  };
}

// ── Outcomes ─────────────────────────────────────────────────

/**
 * What happened after the interaction. Learning changes only this service's
 * own preferences; shared ones belong to the service they came from.
 */
export async function recordOutcome(
  service: Service,
  input: { context_id: string; result: OutcomeResult; item: { name: string; attributes: Attr[] }; because?: Attr[]; note?: string },
) {
  const ctx = await db.contextRequest.findFirst({ where: { id: input.context_id, serviceId: service.id }, include: { profile: true } });
  if (!ctx) throw new ApiError(404, "context_not_found", "That context_id doesn't belong to this service.");
  const p = ctx.profile;
  requireConsent(p, "record");

  const existing = (await db.preference.findMany({ where: { profileId: p.id } })).map(toPref);
  const learned = learnFromOutcome({ result: input.result, attributes: input.item.attributes, because: input.because, existing });
  await applyWrites(p.id, learned.writes);
  await db.customerEvent.create({
    data: {
      profileId: p.id,
      kind: `outcome.${input.result}`,
      summary: `${capital(input.result)} ${input.item.name}${input.note ? `: ${input.note}` : ""}`,
      data: { item: input.item, because: input.because ?? [] },
      contextId: ctx.id,
    },
  });
  await db.contextRequest.update({ where: { id: ctx.id }, data: { outcomeAt: new Date() } });
  await audit(
    service.sandboxId,
    service.slug,
    p.id,
    "outcome.recorded",
    `${capital(input.result)} ${input.item.name}. ${learned.changes.map((c) => `${c.value} ${c.change}`).join(", ") || learned.note}`,
  );
  return {
    customer_id: p.externalId,
    result: input.result,
    changes: learned.changes.map((c) => ({ ...c, category_label: categoryLabel(c.category) })),
    note: learned.note,
  };
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Sharing ──────────────────────────────────────────────────

type GrantRow = { id: string; status: string; categories: string[]; reason: string; createdAt: Date; decidedAt: Date | null; revokedAt: Date | null };
const grantOut = (g: GrantRow) => ({
  id: g.id,
  status: g.status,
  categories: g.categories,
  reason: g.reason,
  created_at: g.createdAt.toISOString(),
  decided_at: g.decidedAt?.toISOString() ?? null,
  revoked_at: g.revokedAt?.toISOString() ?? null,
});

/**
 * Asks a customer to share part of what another service knows about them.
 * Nothing is shared until the customer approves on Self's consent screen,
 * where they sign in to the source service themselves.
 */
export async function requestShare(service: Service, input: { customer_id: string; from_service: string; categories: string[]; reason: string }, origin: string) {
  const p = await findProfile(service, input.customer_id);
  requireConsent(p, "record");
  if (input.from_service === service.slug) throw new ApiError(400, "invalid_request", "A service can't request sharing from itself.");
  const source = await db.selfService.findUnique({ where: { sandboxId_slug: { sandboxId: service.sandboxId, slug: input.from_service } } });
  if (!source) throw new ApiError(404, "service_not_found", `No participating service "${input.from_service}" in this sandbox.`);

  const live = await db.shareGrant.findFirst({ where: { toProfileId: p.id, sourceServiceId: source.id, status: { in: ["PENDING", "ACTIVE"] } } });
  const g =
    live ??
    (await db.shareGrant.create({
      data: { sandboxId: service.sandboxId, toProfileId: p.id, sourceServiceId: source.id, categories: input.categories, reason: input.reason },
    }));
  if (!live)
    await audit(service.sandboxId, service.slug, p.id, "share.requested", `Asked to receive ${input.categories.map(categoryLabel).join(", ")} from ${source.name}.`);
  return { ...grantOut(g), from_service: { slug: source.slug, name: source.name }, consent_url: `${origin}/sandbox/consent/${g.id}`, existing: Boolean(live) };
}

export async function getGrant(service: Service, id: string) {
  const g = await db.shareGrant.findFirst({
    where: { id, sandboxId: service.sandboxId, OR: [{ toProfile: { serviceId: service.id } }, { sourceServiceId: service.id }] },
    include: { sourceService: { select: { slug: true, name: true } } },
  });
  if (!g) throw new ApiError(404, "grant_not_found", "No share grant with that id for this service.");
  return { ...grantOut(g), from_service: g.sourceService };
}

/** Either side of a grant can end it; the customer can too (sandbox consent screen). */
export async function revokeGrant(service: Service, id: string) {
  const g = await db.shareGrant.findFirst({ where: { id, sandboxId: service.sandboxId, OR: [{ toProfile: { serviceId: service.id } }, { sourceServiceId: service.id }] } });
  if (!g) throw new ApiError(404, "grant_not_found", "No share grant with that id for this service.");
  if (!mayRevoke(g.status as GrantStatus)) throw new ApiError(409, "grant_closed", `This grant is already ${g.status.toLowerCase()}.`);
  const next = await db.shareGrant.update({ where: { id }, data: { status: "REVOKED", revokedAt: new Date() } });
  await audit(service.sandboxId, service.slug, g.toProfileId, "share.revoked", `${service.name} ended a share grant.`);
  return grantOut(next);
}

// ── The customer's side (sandbox consent screen) ─────────────

/** What the customer sees on the consent screen. Sandbox-scoped. */
export async function grantForCustomer(sandboxId: string, id: string) {
  const g = await db.shareGrant.findFirst({
    where: { id, sandboxId },
    include: {
      sourceService: { select: { id: true, slug: true, name: true } },
      toProfile: { select: { externalId: true, displayName: true, service: { select: { slug: true, name: true } } } },
      fromProfile: { select: { externalId: true, displayName: true } },
    },
  });
  if (!g) return null;
  // The "sign in at the source" step: in the sandbox, the customer picks which
  // of the source service's synthetic accounts is theirs.
  const sourceAccounts = await db.customerProfile.findMany({
    where: { serviceId: g.sourceService.id },
    select: { id: true, externalId: true, displayName: true, email: true },
    orderBy: { createdAt: "asc" },
  });
  return { grant: g, sourceAccounts };
}

export async function decideGrant(sandboxId: string, id: string, d: { approve: boolean; fromProfileId?: string; categories?: string[] }) {
  const g = await db.shareGrant.findFirst({ where: { id, sandboxId }, include: { sourceService: true, toProfile: { include: { service: true } } } });
  if (!g) return { ok: false as const, message: "That request is gone." };
  if (!mayDecide(g.status as GrantStatus)) return { ok: false as const, message: "This request was already answered." };
  if (!d.approve) {
    await db.shareGrant.update({ where: { id }, data: { status: "DECLINED", decidedAt: new Date() } });
    await audit(sandboxId, "customer", g.toProfileId, "share.declined", `Declined sharing from ${g.sourceService.name} to ${g.toProfile.service.name}.`);
    return { ok: true as const };
  }
  const from = d.fromProfileId ? await db.customerProfile.findFirst({ where: { id: d.fromProfileId, serviceId: g.sourceServiceId } }) : null;
  if (!from) return { ok: false as const, message: `Sign in to ${g.sourceService.name} first.` };
  const categories = approvedCategories(g.categories, d.categories ?? []);
  if (!categories.length) return { ok: false as const, message: "Pick at least one thing to share, or decline." };
  // Updated only if still pending, so two clicks can't both decide.
  const { count } = await db.shareGrant.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "ACTIVE", fromProfileId: from.id, categories, decidedAt: new Date() },
  });
  if (!count) return { ok: false as const, message: "This request was already answered." };
  await audit(
    sandboxId,
    "customer",
    g.toProfileId,
    "share.approved",
    `Approved sharing ${categories.map(categoryLabel).join(", ")} from ${g.sourceService.name} to ${g.toProfile.service.name}.`,
  );
  return { ok: true as const };
}

export async function revokeAsCustomer(sandboxId: string, id: string) {
  const g = await db.shareGrant.findFirst({ where: { id, sandboxId }, include: { sourceService: true } });
  if (!g || !mayRevoke(g.status as GrantStatus)) return { ok: false as const, message: "Nothing to stop." };
  await db.shareGrant.update({ where: { id }, data: { status: "REVOKED", revokedAt: new Date() } });
  await audit(sandboxId, "customer", g.toProfileId, "share.revoked", `The customer stopped sharing from ${g.sourceService.name}.`);
  return { ok: true as const };
}

/** The sandbox's activity log, newest first. */
export async function auditLog(sandboxId: string, take = 40) {
  const rows = await db.selfAuditEntry.findMany({ where: { sandboxId }, orderBy: { createdAt: "desc" }, take });
  return rows.map((r) => ({ id: r.id, actor: r.actor, action: r.action, detail: r.detail, at: r.createdAt.toISOString() }));
}
