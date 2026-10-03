import "server-only";
import { createHash, randomBytes } from "node:crypto";

// The demo shop at /demo is a "Sign in with Self" client, exactly like a real
// company: it uses the public OpenID Connect endpoints of forself.xyz/self.
// Register it on the Self-App review page (redirect URL
// https://forself.xyz/demo/callback) and set the two env vars below.
export const SELF_ISSUER = (process.env.SELF_ISSUER ?? "https://forself.xyz/self").replace(/\/$/, "");
// Server-to-server calls (token, identity, signals) go straight to the
// Self-App rather than through this site's /self rewrite. Locally it's the
// issuer.
const SELF_API = (process.env.SELF_API_BASE ?? (process.env.SELF_ISSUER ? SELF_ISSUER : "https://self-app-iota.vercel.app/self")).replace(/\/$/, "");

export function demoClient() {
  const id = process.env.SELF_DEMO_CLIENT_ID?.trim();
  const secret = process.env.SELF_DEMO_CLIENT_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}

export const COOKIE_LOGIN = "cadence_login";
export const COOKIE_TOKEN = "cadence_token";
export const cookieBase = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/demo" };

// The address the visitor sees (e.g. https://forself.xyz). Behind Vercel the
// request's own URL can carry an internal host, so read the forwarded headers.
// SELF_DEMO_REDIRECT_URI pins it if ever needed.
export function publicOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "");
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

export function redirectUri(origin: string) {
  return process.env.SELF_DEMO_REDIRECT_URI ?? `${origin}/demo/callback`;
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
  // client_secret_post: credentials in the body, so nothing depends on the
  // Authorization header surviving the forself.xyz → Self-App rewrite.
  const res = await fetch(`${SELF_API}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(origin),
      code_verifier: verifier,
      client_id: client.id,
      client_secret: client.secret.trim(),
    }),
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
  const res = await fetch(`${SELF_API}/api/v1/identity`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  return res.ok ? ((await res.json()) as SelfIdentity) : null;
}

export async function sendSignal(token: string, signal: Record<string, unknown>) {
  const res = await fetch(`${SELF_API}/api/v1/signals`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ signals: [signal] }),
    cache: "no-store",
  });
  return res.ok;
}
