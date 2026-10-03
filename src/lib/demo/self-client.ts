import "server-only";
import { createHash, randomBytes } from "node:crypto";

// The demo shop at /demo is a "Sign in with Self" client, exactly like a real
// company: it uses the public OpenID Connect endpoints of forself.xyz/self.
// Register it on the Self-App review page (redirect URL
// https://forself.xyz/demo/callback) and set the two env vars below.
export const SELF_ISSUER = (process.env.SELF_ISSUER ?? "https://forself.xyz/self").replace(/\/$/, "");

export function demoClient() {
  const id = process.env.SELF_DEMO_CLIENT_ID;
  const secret = process.env.SELF_DEMO_CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
}

export const COOKIE_LOGIN = "cadence_login";
export const COOKIE_TOKEN = "cadence_token";
export const cookieBase = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/demo" };

export function redirectUri(origin: string) {
  return `${origin}/demo/callback`;
}

export function newLogin() {
  const verifier = randomBytes(32).toString("base64url");
  return {
    state: randomBytes(16).toString("base64url"),
    nonce: randomBytes(16).toString("base64url"),
    verifier,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
  };
}

export async function exchangeCode(code: string, verifier: string, origin: string) {
  const client = demoClient();
  if (!client) throw new Error("Demo not configured");
  const res = await fetch(`${SELF_ISSUER}/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${Buffer.from(`${encodeURIComponent(client.id)}:${encodeURIComponent(client.secret)}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(origin), code_verifier: verifier }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { access_token: string; expires_in: number };
}

export type Axis = { value: number; low: string; high: string };
export type SelfIdentity = {
  sub: string;
  given_name: string | null;
  email: string | null;
  self: { formed: false } | { formed: true; updated_at: string; axes: Record<string, Axis> };
};

export async function fetchIdentity(token: string): Promise<SelfIdentity | null> {
  const res = await fetch(`${SELF_ISSUER}/api/v1/identity`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  return res.ok ? ((await res.json()) as SelfIdentity) : null;
}

export async function sendSignal(token: string, signal: Record<string, unknown>) {
  const res = await fetch(`${SELF_ISSUER}/api/v1/signals`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ signals: [signal] }),
    cache: "no-store",
  });
  return res.ok;
}
