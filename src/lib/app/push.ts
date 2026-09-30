import "server-only";
import type { NotificationKind } from "@/generated/prisma/client";
import { db } from "../db";

/**
 * Push notifications to the SELF app through Expo's push service. Short and
 * plain: who and what, never a journal line, never contact details. With no
 * tokens (web users, dev) it does nothing. Failures never break the action
 * that triggered them.
 */

const EXPO_PUSH = "https://exp.host/--/api/v2/push/send";

export async function registerPushToken(userId: string, token: string, platform: string | null) {
  if (!/^(Exponent|Expo)PushToken\[.+\]$/.test(token)) return { ok: false as const, message: "That isn't a push token." };
  await db.pushToken.upsert({ where: { token }, create: { userId, token, platform }, update: { userId, platform } });
  return { ok: true as const };
}

export async function forgetPushToken(userId: string, token: string) {
  await db.pushToken.deleteMany({ where: { userId, token } });
  return { ok: true as const };
}

/** Sends one push to each of these people's phones. `to` is the app screen to open. */
export async function push(userIds: string[], msg: { title: string; body: string; to: string }) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (!ids.length) return;
  try {
    const tokens = await db.pushToken.findMany({ where: { userId: { in: ids } }, select: { token: true } });
    if (!tokens.length) return;
    const res = await fetch(EXPO_PUSH, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(tokens.map((t) => ({ to: t.token, title: msg.title, body: msg.body.slice(0, 160), data: { to: msg.to }, sound: "default" }))),
      signal: AbortSignal.timeout(4000),
    });
    const out = (await res.json().catch(() => null)) as { data?: { status: string; details?: { error?: string } }[] } | null;
    // Phones that uninstalled the app: forget their tokens.
    const gone = (out?.data ?? []).map((d, i) => (d.status === "error" && d.details?.error === "DeviceNotRegistered" ? tokens[i]!.token : null)).filter(Boolean) as string[];
    if (gone.length) await db.pushToken.deleteMany({ where: { token: { in: gone } } });
  } catch {
    // Never let a push failure break the request that caused it.
  }
}

/** An inbox notification plus a push, in one call. */
export async function appNotify(
  data: { userId: string; actorId: string; kind: NotificationKind; text: string; href: string; signalId?: string | null; createdAt?: Date },
  to: string,
) {
  await db.notification.create({ data });
  await push([data.userId], { title: "SELF", body: data.text, to });
}
