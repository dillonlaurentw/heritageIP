import { api, parse } from "@/lib/self/http";
import { contextBody } from "@/lib/self/schemas";
import { getContext } from "@/lib/self/store";

/** Relevant context before an interaction, with the reason each item is included. */
export const POST = api(async ({ req, service }) => getContext(service, await parse(req, contextBody)));
