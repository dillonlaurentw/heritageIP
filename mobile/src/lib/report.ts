import { router } from "expo-router";

/** Opens the report screen for a person or something they wrote. */
export function openReport(r: { kind: "PERSON" | "MESSAGE" | "CIRCLE_MESSAGE" | "OPPORTUNITY" | "UPDATE"; name: string; userId?: string; targetId?: string }) {
  router.push({ pathname: "/report", params: { kind: r.kind, name: r.name, ...(r.userId ? { userId: r.userId } : {}), ...(r.targetId ? { targetId: r.targetId } : {}) } });
}
