import { api, parse } from "@/lib/self/http";
import { linkCustomerBody } from "@/lib/self/schemas";
import { linkCustomer, listCustomers } from "@/lib/self/store";

export const GET = api(async ({ service }) => ({ customers: await listCustomers(service) }));

/** Link a customer from your own sign-in. Idempotent on your user id. */
export const POST = api(async ({ req, service }) => linkCustomer(service, await parse(req, linkCustomerBody)));
