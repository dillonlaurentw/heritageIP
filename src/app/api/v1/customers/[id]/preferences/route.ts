import { api, parse } from "@/lib/self/http";
import { preferencesBody } from "@/lib/self/schemas";
import { statePreferences } from "@/lib/self/store";

/** Preferences the customer told you. What they say wins over anything observed. */
export const POST = api<{ id: string }>(async ({ req, service, params }) => statePreferences(service, params.id, await parse(req, preferencesBody)));
