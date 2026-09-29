import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export type AgentState = "idle" | "thinking" | "done" | "error";

/** A quiet status line for an agent: who it is, live or demo, what it's doing. */
export function AgentStatus({ name, state, demo, right }: { name: string; state: AgentState; demo: boolean; right?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-fg-muted">
      <span className={cn("flex size-5 items-center justify-center rounded-md bg-accent-soft text-accent-text", state === "thinking" && "animate-pulse")}>
        <Sparkles className="size-3" />
      </span>
      <span className="font-medium text-fg">{name}</span>
      <span>·</span>
      <span>{state === "thinking" ? "Thinking…" : state === "error" ? "Something went wrong" : demo ? "Demo agent (no API key)" : "Ready"}</span>
      {right && <span className="ml-auto font-mono text-2xs text-fg-subtle">{right}</span>}
    </div>
  );
}
