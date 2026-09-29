import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { bearer } from "better-auth/plugins/bearer";
import { emailOTP } from "better-auth/plugins/email-otp";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "./db";
import { demoLoginEnabled } from "./demo";
import { emailConfigured, sendEmail } from "./email";

/*
 * When real email isn't configured (local dev, demos), the magic link is
 * captured here so the sign-in page can show it on screen instead.
 */
const g = globalThis as unknown as { __selfDevLinks?: Map<string, string> };
const devLinks = (g.__selfDevLinks ??= new Map());

/** The SELF app signs in with a 6-digit code; without email it's captured here (dev and demo only). */
const devCodes = ((globalThis as unknown as { __selfDevCodes?: Map<string, string> }).__selfDevCodes ??= new Map());

export function takeDevCode(email: string) {
  const code = devCodes.get(email.toLowerCase());
  devCodes.delete(email.toLowerCase());
  return code;
}

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
      // 5 links a minute per visitor stops inbox spam. Demo mode switches
      // users often and never sends email, so it gets more room.
      rateLimit: demoLoginEnabled() ? { window: 60, max: 60 } : { window: 60, max: 5 },
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
    // The SELF app (mobile/): a 6-digit code by email, then a bearer token.
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      async sendVerificationOTP({ email, otp }) {
        if (!emailConfigured()) {
          devCodes.set(email.toLowerCase(), otp);
          console.log(`[auth:dev] sign-in code for ${email}: ${otp}`);
          return;
        }
        await sendEmail({
          to: email,
          subject: `${otp} is your SELF code`,
          text: `Your code for the SELF app: ${otp}\n\nIt expires in 10 minutes. If you didn't ask for it, ignore this email.`,
        });
      },
    }),
    bearer(),
    nextCookies(), // must be last: lets server actions set auth cookies
  ],
});
