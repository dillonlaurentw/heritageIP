"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, takeDevMagicLink } from "@/lib/auth";
import { emailConfigured } from "@/lib/email";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string; devLink?: string };

const emailSchema = z.email();

/** Only same-site paths, so a link can't bounce someone to another site. */
const safeNext = (next: unknown) => (typeof next === "string" && /^\/(?!\/)[\w\-/?=&.]*$/.test(next) ? next : "/home");

async function startMagicLink(email: string, next: string) {
  await auth.api.signInMagicLink({
    body: { email, callbackURL: next },
    headers: await headers(),
  });
  return emailConfigured() ? undefined : takeDevMagicLink(email);
}

export async function requestMagicLink(_prev: MagicLinkState, form: FormData): Promise<MagicLinkState> {
  const parsed = emailSchema.safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: "That doesn't look like an email." };
  try {
    const devLink = await startMagicLink(parsed.data, safeNext(form.get("next")));
    return { status: "sent", email: parsed.data, devLink };
  } catch {
    return { status: "error", message: "Couldn't send that. Try again in a minute." };
  }
}

export async function googleSignIn() {
  const res = await auth.api.signInSocial({ body: { provider: "google", callbackURL: "/home" } });
  if (res.url) redirect(res.url as never);
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/founders");
}
