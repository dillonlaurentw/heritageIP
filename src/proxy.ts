import { NextResponse, type NextRequest } from "next/server";

// forself.xyz/self is the SELF calibration, a separate app (the Self-App repo).
// Requests under /self are forwarded to it, so visitors never leave forself.xyz.
const SELF_APP_ORIGIN = process.env.SELF_APP_ORIGIN ?? "https://self-app-iota.vercel.app";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const headers = new Headers(request.headers);

  // The Self-App sees this site's address, not the visitor's, so pass the
  // visitor's IP along (for its usage limit) with the shared key that lets it
  // trust the header. Never forward these headers from the visitor.
  headers.delete("x-self-client-ip");
  headers.delete("x-self-proxy-key");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = process.env.SELF_PROXY_KEY;
  if (ip && key) {
    headers.set("x-self-client-ip", ip);
    headers.set("x-self-proxy-key", key);
  }

  return NextResponse.rewrite(new URL(`${pathname}${search}`, SELF_APP_ORIGIN), {
    request: { headers },
  });
}

export const config = { matcher: ["/self", "/self/:path*"] };
