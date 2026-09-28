import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "./db";
import { emailConfigured, sendEmail } from "./email";

/*
 * When real email isn't configured (local dev, demos), the magic link is
 * captured here so the sign-in page can show it on screen instead.
 */
const g = globalThis as unknown as { __selfDevLinks?: Map<string, string> };
const devLinks = (g.__selfDevLinks ??= new Map());

export function takeDevMagicLink(email: string) {
  const url = devLinks.get(email);
  devLinks.delete(email);
  return url;
}

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const googleEnabled = Boolean(google);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  socialProviders: google,
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      async sendMagicLink({ email, url }) {
        if (!emailConfigured()) {
          devLinks.set(email.toLowerCase(), url);
          console.log(`[auth:dev] magic link for ${email}: ${url}`);
          return;
        }
        await sendEmail({
          to: email,
          subject: "Your way into SELF",
          text: `Here's your sign-in link. It works once and expires in 15 minutes.\n\n${url}\n\nIf you didn't ask for this, ignore it.`,
        });
      },
    }),
    nextCookies(), // must be last: lets server actions set auth cookies
  ],
});
