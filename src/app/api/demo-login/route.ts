import { NextResponse } from "next/server";
import { auth, takeDevMagicLink } from "@/lib/auth";
import { DEMO_EMAIL_DOMAIN, demoLoginEnabled } from "@/lib/demo";

/**
 * Dev/demo only: "sign in as" a seed user. Issues a magic link and follows it
 * immediately. A plain form POST (not a server action) so the browser does a
 * full navigation through the auth callback and keeps the session cookie.
 */
export async function POST(req: Request) {
  const email = String((await req.formData()).get("email") ?? "");
  if (!demoLoginEnabled() || !email.endsWith(DEMO_EMAIL_DOMAIN)) {
    return NextResponse.json({ error: "Demo login is off." }, { status: 403 });
  }
  try {
    await auth.api.signInMagicLink({ body: { email, callbackURL: "/welcome" }, headers: req.headers });
  } catch {
    return NextResponse.json({ error: "Too many switches in a minute. Wait a moment and try again." }, { status: 429 });
  }
  const link = takeDevMagicLink(email);
  if (!link) return NextResponse.json({ error: "Email is configured; use the real link." }, { status: 409 });
  return NextResponse.redirect(link, 303);
}
