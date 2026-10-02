import { api, parse } from "@/lib/self/http";
import { outcomeBody } from "@/lib/self/schemas";
import { recordOutcome } from "@/lib/self/store";

/** What happened after the interaction. Returns exactly what Self learned from it. */
export const POST = api(async ({ req, service }) => recordOutcome(service, await parse(req, outcomeBody)));
