/**
 * Pure rules for team simulations (unit tested). The server applies them;
 * nothing here touches the database.
 */
export const SIM_LIMITS = {
  minPeople: 2,
  maxPeople: 4,
  turnOptions: [6, 9, 12] as const,
  perUserPerDay: 3,
};

/** Can this group run a simulation? Returns an error message, or null if OK. */
export function checkParticipants(input: {
  initiatorId: string;
  participantIds: string[];
  optedIn: Set<string>;
  eligible: Set<string>; // people the initiator is connected to
}): string | null {
  const ids = [...new Set(input.participantIds)];
  if (!ids.includes(input.initiatorId)) return "You're always in your own simulation.";
  if (ids.length < SIM_LIMITS.minPeople) return "Pick at least one other person.";
  if (ids.length > SIM_LIMITS.maxPeople) return `Up to ${SIM_LIMITS.maxPeople} people, including you.`;
  if (!input.optedIn.has(input.initiatorId)) return "Turn on simulations for your own agent first.";
  for (const id of ids) {
    if (id === input.initiatorId) continue;
    if (!input.eligible.has(id)) return "You can only simulate with teammates, candidates and people you're connected to.";
    if (!input.optedIn.has(id)) return "Everyone in a simulation has to have opted in.";
  }
  return null;
}

/** Round-robin speaker for a given turn. */
export const speakerIndex = (turn: number, people: number) => turn % people;

/**
 * Stop early if the agents have clearly wrapped up, but never before
 * everyone has spoken twice.
 */
export function shouldStop(turnCount: number, maxTurns: number, people: number, wantsToEnd: boolean) {
  if (turnCount >= maxTurns) return true;
  return wantsToEnd && turnCount >= people * 2;
}
