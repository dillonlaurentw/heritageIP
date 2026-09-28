import type { ReactNode } from "react";

type Tone = "smoke" | "bone" | "signal" | "field";

const toneClass: Record<Tone, string> = {
  smoke: "text-smoke",
  bone: "text-bone",
  signal: "text-signal",
  field: "text-field",
};

/**
 * Mono metadata label: "HUB 03", "STEP 2/9", "NEW".
 * `live` adds a pulsing Signal dot for control-room states.
 */
export function Label({
  children,
  tone = "smoke",
  live = false,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  live?: boolean;
  className?: string;
}) {
  return (
    <span className={`label inline-flex items-center gap-2 ${toneClass[tone]} ${className}`}>
      {live && (
        <span aria-hidden className="relative inline-flex size-[7px]">
          <span className="absolute inset-0 bg-signal motion-safe:animate-ping" />
          <span className="relative size-[7px] bg-signal" />
        </span>
      )}
      {children}
    </span>
  );
}

/** Solid Signal tag for "NEW" and other rare call-outs. */
export function Tag({ children }: { children: ReactNode }) {
  return <span className="label inline-block bg-signal px-1.5 py-0.5 text-field">{children}</span>;
}
