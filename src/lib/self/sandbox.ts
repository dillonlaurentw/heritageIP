import "server-only";
import { cookies } from "next/headers";
import { SANDBOX_DAYS } from "./sandbox-data";
import { verifySandbox } from "./store";

/**
 * A visitor's sandbox lives in one httpOnly cookie: the sandbox id and its
 * services' keys (sandbox keys only; production keys would never sit in a
 * browser). The server checks the keys against their stored hashes.
 */
export const SANDBOX_COOKIE = "self_sandbox";

type CookieValue = { id: string; keys: Record<string, string> };

export async function readSandbox() {
  const raw = (await cookies()).get(SANDBOX_COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CookieValue;
    if (typeof v?.id !== "string" || typeof v.keys !== "object") return null;
    return await verifySandbox(v.id, v.keys);
  } catch {
    return null;
  }
}

export async function writeSandboxCookie(v: CookieValue) {
  (await cookies()).set(SANDBOX_COOKIE, Buffer.from(JSON.stringify(v)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SANDBOX_DAYS * 86_400,
  });
}
