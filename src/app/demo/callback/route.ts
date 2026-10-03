import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_LOGIN, COOKIE_TOKEN, cookieBase, exchangeCode } from "@/lib/demo/self-client";

// Self sends the visitor back here with a code; swap it for an access token.
export async function GET(request: NextRequest) {
  const back = (q = "") => NextResponse.redirect(new URL(`/demo${q}`, request.url));
  const params = request.nextUrl.searchParams;
  if (params.get("error")) return back("?cancelled=1");

  let saved: { state?: string; verifier?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(COOKIE_LOGIN)?.value ?? "{}");
  } catch {}
  const code = params.get("code");
  if (!code || !saved.verifier || params.get("state") !== saved.state) return back("?failed=1");

  try {
    const tokens = await exchangeCode(code, saved.verifier, request.nextUrl.origin);
    const res = back();
    res.cookies.delete({ name: COOKIE_LOGIN, path: "/demo" });
    res.cookies.set(COOKIE_TOKEN, tokens.access_token, { ...cookieBase, maxAge: tokens.expires_in });
    return res;
  } catch (err) {
    console.error("[demo/callback]", err);
    return back("?failed=1");
  }
}
