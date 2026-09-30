/**
 * The app talks to SELF's server at /api/m/* with a bearer token. Everything
 * that matters (who may see what, contact details, caps) is checked there.
 */
import { Platform } from "react-native";
import type { RingNode } from "./ring";
import { tokenStore } from "./storage";

/** Same origin on the web preview; set EXPO_PUBLIC_API_URL for phones. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === "web" ? "" : "http://localhost:3000")).replace(/\/$/, "");
export const DEMO = process.env.EXPO_PUBLIC_DEMO === "1" || __DEV__;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let onSignedOut: (() => void) | null = null;
export const setSignedOutHandler = (fn: () => void) => {
  onSignedOut = fn;
};

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
      credentials: "omit",
    });
  } catch {
    throw new ApiError("Can't reach SELF. Check your connection.", 0);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
  if (res.status === 401 && token) {
    await tokenStore.clear();
    onSignedOut?.();
  }
  if (!res.ok) throw new ApiError(data.error ?? data.message ?? "Something went wrong.", res.status);
  return data as T;
}

// ── Types (what the server sends) ──

export type Access = "NONE" | "APPLIED" | "MEMBER";
export type Me = {
  id: string;
  name: string;
  email: string;
  access: Access;
  onboarded: boolean;
  headline: string | null;
  application: { building: string; lastWeek: string; status: string; createdAt: string } | null;
};
export type Need = { key: string; title: string; detail: string; to: string };
export type Today = {
  name: string;
  wroteToday: boolean;
  circle: { name: string; unread: number } | null;
  ring: RingNode[];
  needs: Need[];
  company: { name: string; steps: string[] } | null;
};
export type JournalLine = { id: string; who: "me" | "self"; text: string; spoken: boolean; demo: boolean; shared: boolean; at: string };
export type Journal = { today: JournalLine[]; earlier: { day: string; messages: JournalLine[] }[] };
export type CircleMsg = { id: string; text: string; at: string; fromJournal: boolean; author: { id: string; name: string } | null };
export type Circle = {
  id: string;
  name: string;
  members: { id: string; name: string; headline: string | null; activeThisWeek: boolean }[];
  messages: CircleMsg[];
  summary: { text: string; helps: { from: string; to: string; why: string }[]; demo: boolean } | null;
};
export type Ask = { status: "none" } | { status: "pending"; since: string } | { status: "yes"; conversationId: string | null } | { status: "not now" };
export type MentorCard = { id: string; name: string; headline: string | null; focus: string[]; note: string | null; open: boolean; ask: Ask };
export type Mentor = MentorCard & { location: string | null };
export type Request = { id: string; kind: string; asks: string; concierge: boolean; note: string; at: string; from: { id: string; name: string; headline: string | null }; company: string | null };
export type OppStatus = "PENDING" | "PICKED" | "NOT_THIS_TIME" | "WITHDRAWN" | null;
export type Opportunity = {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  description: string;
  place: string;
  startsAt: string;
  seats: number;
  forWho: string;
  costNote: string | null;
  open: boolean;
  host: { id: string; name: string; line: string | null };
  why: string | null;
  request: OppStatus;
};
export type OpportunityDetail = Opportunity & { myWhy: string | null; isHost: boolean };
export type Hosted = Opportunity & {
  picked: number;
  requests: { id: string; why: string; status: string; at: string; who: { id: string; name: string; headline: string | null } }[];
};
export type NewOpportunity = {
  kind: string;
  title: string;
  description: string;
  place: string;
  startsAt: string;
  seats: number;
  forWho: string;
  fields: string[];
  stages: string[];
  buildingOnly: boolean;
  costNote: string | null;
};
export type State = "none" | "pending" | "yes" | "not now";
export type Update = { id: string; text: string; at: string };
export type MyCapital = { openToBackers: boolean; updates: Update[]; followers: string[]; interest: { id: string; status: string; note: string; at: string; from: string }[]; isBacker: boolean };
export type FounderForBacker = {
  id: string;
  name: string;
  headline: string | null;
  location: string | null;
  company: { name: string; oneLiner: string | null } | null;
  following: boolean;
  interest: State;
  updates: Update[];
};
export type PartnerCard = { id: string; name: string; tagline: string; description: string; categories: string[]; services: string[]; location: string; priceNote: string | null; intro: State };
export type CoFounder = { id: string; name: string; headline: string | null; location: string | null; strengths: string | null; buildingToward: string | null; lookingFor: string | null; field: string | null; sameField: boolean; hello: State };
export type ConversationRow = {
  id: string;
  other: { id: string; name: string };
  about: string | null;
  last: { text: string; mine: boolean; at: string } | null;
  unread: boolean;
};
export type Thread = {
  me: string;
  other: { id: string; name: string; headline: string | null };
  messages: { id: string; authorId: string; kind: string; text: string; at: string }[];
};
export type SelfDoc = {
  facets: { key: string; label: string; hint: string; lines: { id: string; text: string; source: string }[] }[];
  suggestions: { id: string; text: string; why: string; facet: string }[];
  optIn: boolean;
};
export type Invite = { code: string; usedBy: string | null; usedAt: string | null };

// ── Calls ──

export const api = {
  /** Step 1 of sign-in: email a 6-digit code. */
  sendCode: (email: string) => request<unknown>("/api/auth/email-otp/send-verification-otp", { body: { email, type: "sign-in" } }),
  /** Step 2: trade the code for a bearer token (sent back in a header). */
  async verifyCode(email: string, otp: string): Promise<string> {
    const res = await fetch(`${API_URL}/api/auth/sign-in/email-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, otp }),
      credentials: "omit",
    }).catch(() => null);
    if (!res) throw new ApiError("Can't reach SELF. Check your connection.", 0);
    const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
    const token = res.headers.get("set-auth-token") ?? data.token;
    if (!res.ok || !token) throw new ApiError(res.status === 400 || res.status === 401 ? "That code didn't work. Check it, or ask for a new one." : (data.message ?? "Couldn't sign in."), res.status);
    return token;
  },
  demoLogin: (email: string) => request<{ token: string }>("/api/m/demo-login", { body: { email } }),

  me: () => request<Me>("/api/m/me"),
  saveBasics: (b: { name: string; headline: string; beliefs: string; buildingToward: string; gaps: string; field: string; stage: string }) => request<{ ok: true }>("/api/m/me", { body: b }),
  redeem: (code: string) => request<{ ok: true }>("/api/m/access/redeem", { body: { code } }),
  apply: (building: string, lastWeek: string) => request<{ ok: true }>("/api/m/access/apply", { body: { building, lastWeek } }),

  today: () => request<Today>("/api/m/today"),
  journal: () => request<Journal>("/api/m/journal"),
  write: (text: string, spoken: boolean) => request<{ ok: true; replyError?: string }>("/api/m/journal", { body: { text, spoken } }),
  deleteEntry: (id: string) => request<{ ok: true }>(`/api/m/journal/${id}`, { method: "DELETE" }),
  shareEntry: (id: string) => request<{ ok: true }>(`/api/m/journal/${id}/share`, { method: "POST" }),

  circle: () => request<{ me: string; circle: Circle | null }>("/api/m/circle"),
  say: (text: string) => request<{ ok: true }>("/api/m/circle", { body: { text } }),
  catchUp: () => request<{ ok: true }>("/api/m/circle/summary", { method: "POST" }),

  mentors: () => request<{ mentors: MentorCard[] }>("/api/m/mentors"),
  mentor: (id: string) => request<Mentor>(`/api/m/mentors/${id}`),
  askMentor: (id: string, note: string) => request<{ ok: true }>(`/api/m/mentors/${id}/ask`, { body: { note } }),
  requests: () => request<{ requests: Request[] }>("/api/m/requests"),

  opportunities: () => request<{ opportunities: Opportunity[]; canHost: boolean }>("/api/m/opportunities"),
  opportunity: (id: string) => request<OpportunityDetail>(`/api/m/opportunities/${id}`),
  askSeat: (id: string, why: string) => request<{ ok: true }>(`/api/m/opportunities/${id}/request`, { body: { why } }),
  withdrawSeat: (id: string) => request<{ ok: true }>(`/api/m/opportunities/${id}/request`, { method: "DELETE" }),
  hosting: () => request<{ hosting: Hosted[] }>("/api/m/hosting"),
  host: (o: NewOpportunity) => request<{ ok: true; id: string }>("/api/m/opportunities", { body: o }),
  answerSeat: (requestId: string, answer: "pick" | "not this time") => request<{ ok: true; conversationId?: string }>(`/api/m/hosting/${requestId}`, { body: { answer } }),
  closeOpportunity: (id: string) => request<{ ok: true }>(`/api/m/opportunities/${id}/close`, { method: "POST" }),

  capital: () => request<MyCapital>("/api/m/capital"),
  setOpenToBackers: (openToBackers: boolean) => request<{ ok: true }>("/api/m/capital", { body: { openToBackers } }),
  postUpdate: (text: string) => request<{ ok: true }>("/api/m/capital/updates", { body: { text } }),
  deleteUpdate: (id: string) => request<{ ok: true }>(`/api/m/capital/updates/${id}`, { method: "DELETE" }),
  founders: () => request<{ founders: FounderForBacker[] }>("/api/m/capital/founders"),
  follow: (id: string, on: boolean) => request<{ ok: true }>(`/api/m/capital/founders/${id}/follow`, { body: { on } }),
  interest: (id: string, note: string) => request<{ ok: true }>(`/api/m/capital/founders/${id}/interest`, { body: { note } }),

  partners: () => request<{ partners: PartnerCard[] }>("/api/m/partners"),
  askIntro: (id: string, note: string) => request<{ ok: true }>(`/api/m/partners/${id}/intro`, { body: { note } }),
  coFounders: () => request<{ people: CoFounder[]; me: { open: boolean; note: string | null } }>("/api/m/cofounders"),
  setOpenToMatches: (open: boolean, note: string | null) => request<{ ok: true }>("/api/m/cofounders/me", { body: { open, note } }),
  hello: (id: string, note: string) => request<{ ok: true }>(`/api/m/cofounders/${id}/hello`, { body: { note } }),
  answer: (id: string, answer: "yes" | "not now") => request<{ ok: true; conversationId: string | null }>(`/api/m/requests/${id}`, { body: { answer } }),

  conversations: () => request<{ conversations: ConversationRow[] }>("/api/m/messages"),
  thread: (id: string) => request<Thread>(`/api/m/messages/${id}`),
  send: (id: string, text: string) => request<{ ok: true }>(`/api/m/messages/${id}`, { body: { text } }),
  openWith: (userId: string) => request<{ id: string }>(`/api/m/messages/with/${userId}`, { method: "POST" }),

  self: () => request<SelfDoc>("/api/m/self"),
  changeSelf: (op: { type: "accept" | "reject" | "remove"; id: string } | { type: "add"; facet: string; text: string }) => request<{ ok: true }>("/api/m/self", { body: op }),
  invites: () => request<{ invites: Invite[] }>("/api/m/invites"),
};
