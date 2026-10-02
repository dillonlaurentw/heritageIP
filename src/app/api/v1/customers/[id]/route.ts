import { api } from "@/lib/self/http";
import { deleteCustomer, getCustomer } from "@/lib/self/store";

export const GET = api<{ id: string }>(async ({ service, params }) => getCustomer(service, params.id));

/** Deletes everything your service holds about this customer. */
export const DELETE = api<{ id: string }>(async ({ service, params }) => deleteCustomer(service, params.id));
