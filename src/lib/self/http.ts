import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { ApiError, serviceForKey, type Service } from "./store";

/**
 * The Self API's HTTP layer. Every /api/v1 route goes through `api()`:
 * bearer-key auth, JSON errors with a stable `code`, and the sandbox label on
 * every response so nothing reads as production.
 */

const HEADERS = { "Self-Environment": "sandbox", "Cache-Control": "no-store" };

export function json(data: object, status = 200) {
  return NextResponse.json({ environment: "sandbox", ...data }, { status, headers: HEADERS });
}

export function apiError(status: number, code: string, message: string, extra?: object) {
  return NextResponse.json({ environment: "sandbox", error: { code, message, ...extra } }, { status, headers: HEADERS });
}

export async function parse<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json", "The request body must be JSON.");
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const issue = r.error.issues[0];
    throw new ApiError(400, "invalid_request", `${issue.path.join(".") || "body"}: ${issue.message}`);
  }
  return r.data;
}

type Ctx<P> = { params: Promise<P> };

export function api<P = Record<string, never>>(fn: (args: { req: Request; service: Service; params: P }) => Promise<object>, status = 200) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const header = req.headers.get("authorization") ?? "";
      const key = header.match(/^Bearer\s+(\S+)$/i)?.[1];
      if (!key) return apiError(401, "missing_key", "Send your sandbox key as: Authorization: Bearer self_test_…");
      const service = await serviceForKey(key);
      if (!service) return apiError(401, "invalid_key", "That key isn't valid, or its sandbox has expired. Open a new sandbox at /sandbox.");
      return json(await fn({ req, service, params: await ctx.params }), status);
    } catch (e) {
      if (e instanceof ApiError) return apiError(e.status, e.code, e.message);
      console.error("[self api]", e);
      return apiError(500, "server_error", "Something went wrong on our side.");
    }
  };
}
