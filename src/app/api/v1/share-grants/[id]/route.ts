import { api } from "@/lib/self/http";
import { getGrant, revokeGrant } from "@/lib/self/store";

export const GET = api<{ id: string }>(async ({ service, params }) => getGrant(service, params.id));

/** Either service in a grant can end it. */
export const DELETE = api<{ id: string }>(async ({ service, params }) => revokeGrant(service, params.id));
