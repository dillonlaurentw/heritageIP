import "server-only";

export { agentsLive, LIMITS } from "./config";
export { runAgent, runsToday } from "./run";
export { ideasAgent } from "./prompts/ideas";
export { thesisDraftAgent, thesisQuestionsAgent, type ThesisCtx } from "./prompts/thesis";
export { gamePlanAgent, type GamePlanCtx } from "./prompts/gamePlan";
export { defaultPersona, personaAgent } from "./prompts/persona";
export { fitReportAgent, simulationTurnAgent, type SimPerson, type SimTurnCtx } from "./prompts/simulation";
