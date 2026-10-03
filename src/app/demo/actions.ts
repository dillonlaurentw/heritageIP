"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { findProduct } from "@/lib/demo/catalogue";
import { COOKIE_TOKEN, sendSignal } from "@/lib/demo/self-client";

// Tells Self what the visitor did, so their Self keeps learning.
export async function signalAction(formData: FormData) {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  const product = findProduct(String(formData.get("productId") ?? ""));
  const type = formData.get("type") === "rejected" ? "rejected" : "saved";
  if (!token || !product) return;
  await sendSignal(token, {
    type,
    item: { id: product.id, name: product.name, category: "outdoor", attributes: { detail: product.detail, price: product.price } },
    ...(type === "rejected" ? { reason: "not for me" } : {}),
  });
  revalidatePath("/demo");
}
