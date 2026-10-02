/** Shapes of Self API responses, as the sandbox console reads them. */

export type Consent = { personalization: boolean; ai_agents: boolean; updated_at: string | null };

export type CustomerRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  consent: Consent;
  preference_count: number;
};

export type PrefOut = {
  category: string;
  value: string;
  stance: "LIKES" | "AVOIDS";
  source: "STATED" | "OBSERVED";
  evidence: number;
  note: string | null;
  last_evidence_at: string;
};

export type GrantOut = {
  id: string;
  status: "PENDING" | "ACTIVE" | "DECLINED" | "REVOKED";
  categories: string[];
  reason: string;
  created_at: string;
  from_service?: { slug: string; name: string };
  to_service?: { slug: string; name: string };
};

export type CustomerDetail = Omit<CustomerRow, "preference_count"> & {
  preferences: PrefOut[];
  events: Array<{ id: string; kind: string; summary: string; created_at: string; context_id: string | null }>;
  sharing: { incoming: GrantOut[]; outgoing: GrantOut[] };
};

export type ContextOut = {
  context_id: string;
  customer_id: string;
  purpose: string;
  query: string | null;
  items: Array<{
    category: string;
    value: string;
    stance: "LIKES" | "AVOIDS";
    source: "STATED" | "OBSERVED";
    evidence: number;
    note: string | null;
    from: { service: string; name: string; shared: boolean };
    why_relevant: string[];
  }>;
  prompt: string;
};

export type OutcomeOut = {
  changes: Array<{ category: string; category_label: string; value: string; stance: string; change: string; why: string }>;
  note: string;
};

export type ApiErrorBody = { error: { code: string; message: string } };

export type LogEntry = {
  id: number;
  method: string;
  path: string;
  body?: unknown;
  status: number;
  ms: number;
  response: unknown;
  service: string;
};

export type SandboxService = { slug: string; name: string; description: string; keyHint: string; key: string };
export type AuditRow = { id: string; actor: string; action: string; detail: string; at: string };
