import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getViewer, type Viewer } from "../session";

/**
 * The SELF app's API (/api/m/*) is JSON over bearer tokens from Better Auth.
 * Every route starts with `appViewer()`; members-only routes pass `member`.
 */
export async function appViewer(opts: { member?: boolean } = {}): Promise<{ viewer: Viewer; res?: never } | { viewer?: never; res: NextResponse }> {
  const viewer = await getViewer();
  if (!viewer) return { res: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (opts.member && viewer.profile.access !== "MEMBER") return { res: NextResponse.json({ error: "SELF is invite-only for now." }, { status: 403 }) };
  return { viewer };
}

export const ok = <T,>(data: T) => NextResponse.json(data);
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Parses a JSON body against a schema; returns null on anything malformed. */
export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T> | null> {
  try {
    const parsed = schema.safeParse(await req.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** A result from the lib (`{ ok, message }`) as a response. */
export const result = (r: { ok: true } | { ok: false; message: string }) => (r.ok ? ok({ ok: true }) : fail(r.message));
