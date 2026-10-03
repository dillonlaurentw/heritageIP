import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_LOGIN, SELF_ISSUER, cookieBase, demoClient, newLogin, redirectUri } from "@/lib/demo/self-client";

// "Sign in with Self": send the visitor to Self with PKCE, state and nonce.
export function GET(request: NextRequest) {
  const client = demoClient();
  if (!client) return NextResponse.redirect(new URL("/demo", request.url));
  const login = newLogin();
  const url = new URL(`${SELF_ISSUER}/oauth/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: client.id,
    redirect_uri: redirectUri(request.nextUrl.origin),
    scope: "openid profile email",
    state: login.state,
    nonce: login.nonce,
    code_challenge: login.challenge,
    code_challenge_method: "S256",
  }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set(COOKIE_LOGIN, JSON.stringify({ state: login.state, verifier: login.verifier }), { ...cookieBase, maxAge: 600 });
  return res;
}
