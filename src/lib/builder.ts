import type { BuilderContext } from "@/agents/context";
import type { Viewer } from "./session";

/** What agents know about the person they're helping: their own answers. */
export function builderContext(viewer: Viewer): BuilderContext {
  const p = viewer.profile;
  return {
    name: viewer.user.name,
    headline: p.headline,
    beliefs: p.beliefs,
    workStyle: p.workStyle,
    buildingToward: p.buildingToward,
    strengths: p.strengths,
    gaps: p.gaps,
    decisionStyle: p.decisionStyle,
  };
}
