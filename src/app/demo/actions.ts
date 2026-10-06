"use server";

import { cookies } from "next/headers";
import { findProduct } from "@/lib/demo/catalogue";
import { COOKIE_TOKEN, askSelf, confirmStatus, requestConfirm, sendSignal, type ConfirmStatus, type SelfAnswer } from "@/lib/demo/self-client";

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

export type AskState = { question?: string; result?: SelfAnswer; error?: string };

// "Ask Self, as Cadence": the kind of question a company's workflow or agent
// would ask.
export async function askAction(_prev: AskState, formData: FormData): Promise<AskState> {
  const question = String(formData.get("question") ?? "").trim();
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  if (!token) return { error: "Your sign-in expired. Sign in again." };
  if (question.length < 3) return { error: "Ask a question." };
  const result = await askSelf(token, { question: question.slice(0, 1000), context: "Cadence Outdoor, an outdoor gear shop, serving this signed-in customer." });
  return result ? { question, result } : { question, error: "Couldn’t reach Self. Try again." };
}

export type CheckInState = { id?: string; contact?: string; error?: string };

// At the counter: ask someone's Self to confirm it's them.
export async function checkInAction(_prev: CheckInState, formData: FormData): Promise<CheckInState> {
  const contact = String(formData.get("contact") ?? "").trim();
  if (!contact) return { error: "Enter their phone number or email." };
  const result = await requestConfirm(contact, "Check in at Cadence Outdoor");
  return "id" in result ? { id: result.id, contact } : { error: result.error };
}

// Has the person answered yet?
export async function checkInStatusAction(id: string): Promise<ConfirmStatus | null> {
  return confirmStatus(id);
}
