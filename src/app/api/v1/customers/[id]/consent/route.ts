import { api, parse } from "@/lib/self/http";
import { consentBody } from "@/lib/self/schemas";
import { setConsent } from "@/lib/self/store";

/** Relay the customer's choices from your settings screen. */
export const PUT = api<{ id: string }>(async ({ req, service, params }) => ({ consent: await setConsent(service, params.id, await parse(req, consentBody)) }));
