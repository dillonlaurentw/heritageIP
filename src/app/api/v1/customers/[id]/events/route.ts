import { api, parse } from "@/lib/self/http";
import { eventBody } from "@/lib/self/schemas";
import { recordEvent } from "@/lib/self/store";

/** A meaningful interaction worth keeping: feedback, a purchase, a support question. */
export const POST = api<{ id: string }>(async ({ req, service, params }) => ({ event: await recordEvent(service, params.id, await parse(req, eventBody)) }), 201);
