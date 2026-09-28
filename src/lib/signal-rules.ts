/**
 * Pure rules for the Signal state machine, shared by server and tests.
 *
 *   PENDING ──accept──▶ ACCEPTED   (recipient only)
 *      │    ──decline─▶ DECLINED   (recipient only)
 *      └────withdraw──▶ WITHDRAWN  (sender only)
 *
 * Nothing moves out of ACCEPTED, DECLINED or WITHDRAWN.
 */
export type SignalStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
export type SignalAction = "accept" | "decline" | "withdraw";

export function nextStatus(
  s: { status: SignalStatus; fromUserId: string; toUserId: string },
  action: SignalAction,
  actorId: string,
): { ok: true; status: SignalStatus } | { ok: false; reason: string } {
  if (s.status !== "PENDING") return { ok: false, reason: "This has already been answered." };
  if (action === "withdraw") {
    return actorId === s.fromUserId ? { ok: true, status: "WITHDRAWN" } : { ok: false, reason: "Only the sender can withdraw." };
  }
  if (actorId !== s.toUserId) return { ok: false, reason: "Only the recipient can answer this." };
  return { ok: true, status: action === "accept" ? "ACCEPTED" : "DECLINED" };
}

/** Contact details are visible only between the two people on an accepted signal. */
export function revealsContact(
  s: { status: SignalStatus; fromUserId: string; toUserId: string },
  viewerId: string,
  otherId: string,
) {
  return (
    s.status === "ACCEPTED" &&
    ((s.fromUserId === viewerId && s.toUserId === otherId) || (s.toUserId === viewerId && s.fromUserId === otherId))
  );
}

export const STATUS_LABEL: Record<SignalStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
};
