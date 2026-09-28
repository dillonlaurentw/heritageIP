import { Label } from "@/components/ui/Label";

export type AgentState = "idle" | "thinking" | "done" | "error";

const STATE: Record<AgentState, string> = {
  idle: "Standing by",
  thinking: "Thinking",
  done: "Done",
  error: "Stopped",
};

/**
 * Control-room status bar for any agent: "● LIVE · THESIS AGENT · ROUND 01/03".
 * `demo` marks canned output when no API key is configured.
 */
export function AgentStrip({
  agent,
  state,
  demo = false,
  right,
}: {
  agent: string;
  state: AgentState;
  demo?: boolean;
  right?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-line px-4 py-3" aria-live="polite">
      <div className="flex flex-wrap items-center gap-6">
        <Label live={state === "thinking"} tone={state === "thinking" ? "signal" : state === "error" ? "signal" : "smoke"}>
          {STATE[state]}
        </Label>
        <Label tone="bone">{agent}</Label>
        {demo && <Label tone="signal">Demo agent · No API key</Label>}
      </div>
      {right && <Label tone="bone">{right}</Label>}
    </div>
  );
}
