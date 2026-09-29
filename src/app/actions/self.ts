"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FACETS } from "@/lib/self-doc";
import { changeSelf, findSuggestions } from "@/lib/self";
import { requireOnboarded } from "@/lib/session";

const opSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add"), facet: z.enum(FACETS), text: z.string().max(2000) }),
  z.object({ type: z.literal("edit"), id: z.string().max(64), text: z.string().max(2000) }),
  z.object({ type: z.literal("remove"), id: z.string().max(64) }),
  z.object({ type: z.literal("accept"), id: z.string().max(64), text: z.string().max(2000).optional() }),
  z.object({ type: z.literal("reject"), id: z.string().max(64) }),
]);

/** Add, edit or remove a line of your Self, or answer an "Is this you?" suggestion. Only ever your own. */
export async function updateSelf(input: z.infer<typeof opSchema>) {
  const viewer = await requireOnboarded();
  const parsed = opSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "That change didn't make sense. Try again." };
  const res = await changeSelf(viewer, parsed.data);
  revalidatePath("/me/self");
  return res;
}

/** Ask your Self agent for new "Is this you?" lines from what you've said and done on SELF. */
export async function suggestSelfLines() {
  const viewer = await requireOnboarded();
  const res = await findSuggestions(viewer);
  revalidatePath("/me/self");
  return res;
}
