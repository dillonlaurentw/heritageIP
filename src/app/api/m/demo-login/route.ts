import { auth, takeDevCode } from "@/lib/auth";
import { fail, ok } from "@/lib/app/http";
import { DEMO_EMAIL_DOMAIN, demoLoginEnabled } from "@/lib/demo";

/** Demo only: sign the app in as a seed person and hand back a bearer token. */
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!demoLoginEnabled() || !email || !email.endsWith(DEMO_EMAIL_DOMAIN)) return fail("Demo sign-in is off.", 403);
  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const otp = takeDevCode(email);
  if (!otp) return fail("Email is configured; use the code from your inbox.", 409);
  const res = await auth.api.signInEmailOTP({ body: { email, otp }, returnHeaders: true, headers: req.headers });
  const token = res.headers.get("set-auth-token") ?? (res.response as { token?: string }).token;
  if (!token) return fail("Couldn't sign in.", 500);
  return ok({ token });
}
