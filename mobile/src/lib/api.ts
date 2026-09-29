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
export type Hour = { id: string; at: string; minutes: number; topic: string | null; with: string; mentorId: string; role: "mentor" | "founder" };
export type Today = {
  name: string;
  circle: { name: string; members: number; checkedIn: number; mine: boolean } | null;
  ring: RingNode[];
  hours: Hour[];
  needs: Need[];
  company: { name: string; steps: { title: string; stage: string | null }[] } | null;
};
export type Reply = { id: string; text: string; at: string; authorId: string; author: string };
export type CheckIn = { id: string; userId: string; name: string; did: string; stuck: string; need: string; at: string; replies: Reply[] };
export type Circle = {
  id: string;
  name: string;
  weekOf: string;
  members: { id: string; name: string; headline: string | null; checkedIn: boolean }[];
  checkIns: CheckIn[];
  mine: CheckIn | null;
  summary: { text: string; helps: { from: string; to: string; why: string }[]; demo: boolean } | null;
};
export type MentorCard = {
  id: string;
  name: string;
  headline: string | null;
  focus: string[];
  note: string | null;
  openSlots: number;
  next: { id: string; at: string; minutes: number } | null;
};
export type Mentor = {
  id: string;
  name: string;
  headline: string | null;
  location: string | null;
  focus: string[];
  note: string | null;
  open: boolean;
  slots: { id: string; at: string; minutes: number; mine: boolean; topic: string | null }[];
};
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
  saveBasics: (b: { name: string; headline: string; beliefs: string; buildingToward: string; gaps: string }) => request<{ ok: true }>("/api/m/me", { body: b }),
  redeem: (code: string) => request<{ ok: true }>("/api/m/access/redeem", { body: { code } }),
  apply: (building: string, lastWeek: string) => request<{ ok: true }>("/api/m/access/apply", { body: { building, lastWeek } }),

  today: () => request<Today>("/api/m/today"),
  circle: () => request<{ me: string; circle: Circle | null }>("/api/m/circle"),
  checkIn: (b: { did: string; stuck: string; need: string }) => request<{ ok: true }>("/api/m/circle/checkin", { body: b }),
  reply: (checkInId: string, text: string) => request<{ ok: true }>("/api/m/circle/reply", { body: { checkInId, text } }),
  summarise: () => request<{ ok: true }>("/api/m/circle/summary", { method: "POST" }),

  mentors: () => request<{ mentors: MentorCard[] }>("/api/m/mentors"),
  mentor: (id: string) => request<Mentor>(`/api/m/mentors/${id}`),
  book: (slotId: string, topic: string) => request<{ ok: true }>(`/api/m/hours/${slotId}/book`, { body: { topic } }),

  conversations: () => request<{ conversations: ConversationRow[] }>("/api/m/messages"),
  thread: (id: string) => request<Thread>(`/api/m/messages/${id}`),
  send: (id: string, text: string) => request<{ ok: true }>(`/api/m/messages/${id}`, { body: { text } }),
  openWith: (userId: string) => request<{ id: string }>(`/api/m/messages/with/${userId}`, { method: "POST" }),

  self: () => request<SelfDoc>("/api/m/self"),
  changeSelf: (op: { type: "accept" | "reject" | "remove"; id: string } | { type: "add"; facet: string; text: string }) => request<{ ok: true }>("/api/m/self", { body: op }),
  invites: () => request<{ invites: Invite[] }>("/api/m/invites"),
};
