"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATEGORY_KEYS } from "@/lib/self/domains";
import { readSandbox, writeSandboxCookie } from "@/lib/self/sandbox";
import { createSandbox, decideGrant, deleteSandbox, revokeAsCustomer } from "@/lib/self/store";

/** Opens a sandbox for this browser, or goes back to the one it has. */
export async function openSandbox() {
  if (!(await readSandbox())) await writeSandboxCookie(await createSandbox());
  redirect("/sandbox");
}

/** Throws the sandbox away and starts again from the synthetic customers. */
export async function resetSandbox() {
  const current = await readSandbox();
  if (current) await deleteSandbox(current.id);
  await writeSandboxCookie(await createSandbox());
  revalidatePath("/sandbox");
  redirect("/sandbox");
}

const decision = z.object({
  grantId: z.string().min(1).max(64),
  approve: z.boolean(),
  fromProfileId: z.string().max(64).optional(),
  categories: z.array(z.enum(CATEGORY_KEYS as [string, ...string[]])).max(CATEGORY_KEYS.length).optional(),
});

/** The customer's answer on the consent screen. Only inside your own sandbox. */
export async function decideShare(input: z.infer<typeof decision>) {
  const sandbox = await readSandbox();
  if (!sandbox) return { ok: false as const, message: "Your sandbox has expired. Open a new one." };
  const d = decision.safeParse(input);
  if (!d.success) return { ok: false as const, message: "That didn't look right. Try again." };
  const r = await decideGrant(sandbox.id, d.data.grantId, d.data);
  revalidatePath("/sandbox");
  return r;
}

export async function stopSharing(grantId: string) {
  const sandbox = await readSandbox();
  if (!sandbox) return { ok: false as const, message: "Your sandbox has expired. Open a new one." };
  const id = z.string().min(1).max(64).safeParse(grantId);
  if (!id.success) return { ok: false as const, message: "Nothing to stop." };
  const r = await revokeAsCustomer(sandbox.id, id.data);
  revalidatePath("/sandbox");
  return r;
}
