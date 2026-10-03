"use server";

import { cookies } from "next/headers";
import { findProduct } from "@/lib/demo/catalogue";
import { COOKIE_TOKEN, sendSignal } from "@/lib/demo/self-client";

export type SignalState = { sent?: "saved" | "rejected"; error?: string };

// Tells Self what the visitor did, so their Self keeps learning.
export async function signalAction(_prev: SignalState, formData: FormData): Promise<SignalState> {
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  const product = findProduct(String(formData.get("productId") ?? ""));
  const type = formData.get("type") === "rejected" ? "rejected" : "saved";
  if (!token) return { error: "Your sign-in expired. Sign in again." };
  if (!product) return { error: "Unknown product." };
  const ok = await sendSignal(token, {
    type,
    item: { id: product.id, name: product.name, category: "outdoor", attributes: { detail: product.detail, price: product.price } },
    ...(type === "rejected" ? { reason: "not for me" } : {}),
  });
  return ok ? { sent: type } : { error: "Couldn’t reach Self. Try again." };
}
