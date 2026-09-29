import type { BuilderContext } from "@/agents/context";
import { parseSelfDoc, renderPersona } from "./self-doc";
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
    self: selfLines(viewer),
  };
}

/** The approved lines of someone's Self, without the name header; null until they've saved one. */
function selfLines(viewer: Viewer) {
  const doc = parseSelfDoc(viewer.profile.selfDoc);
  if (!doc || doc.lines.length === 0) return null;
  return renderPersona(viewer.user.name, doc).split("\n").slice(1).join("\n");
}
