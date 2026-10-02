import { api, parse } from "@/lib/self/http";
import { shareRequestBody } from "@/lib/self/schemas";
import { requestShare } from "@/lib/self/store";

/** Ask the customer to share part of what another service knows. Returns a consent URL. */
export const POST = api(async ({ req, service }) => requestShare(service, await parse(req, shareRequestBody), new URL(req.url).origin), 201);
