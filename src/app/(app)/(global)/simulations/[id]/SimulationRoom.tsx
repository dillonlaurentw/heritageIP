"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nextTurn, writeReport } from "@/app/actions/simulations";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Turn = { index: number; speakerId: string; speaker: string; text: string };
type Person = { id: string; name: string };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The simulation room. Whoever started it drives it one turn per request, so
 * it can be watched live, paused or ended early. Everyone else sees it
 * refresh as turns land.
 */
export function SimulationRoom({
  simId,
  people,
  initialTurns,
  maxTurns,
  status,
  hasReport,
  driver,
  demo,
}: {
  simId: string;
  people: Person[];
  initialTurns: Turn[];
  maxTurns: number;
  status: "RUNNING" | "DONE" | "CANCELLED";
  hasReport: boolean;
  driver: boolean;
  demo: boolean;
}) {
  const router = useRouter();
  const [driven, setTurns] = useState(initialTurns);
  const turns = driver ? driven : initialTurns;
  const [running, setRunning] = useState(driver && status === "RUNNING" && !hasReport);
  const [localPhase, setPhase] = useState<"turns" | "report" | "done">(hasReport ? "done" : "turns");
  const phase = status === "CANCELLED" ? "stopped" : hasReport ? "done" : localPhase;
  const [error, setError] = useState<string | null>(null);
  const loop = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running || loop.current) return;
    loop.current = true;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        const res = await nextTurn(simId);
        if (!res.ok) {
          setError(res.message);
          setRunning(false);
          router.refresh();
          break;
        }
        if (res.turn) setTurns((t) => (t.some((x) => x.index === res.turn!.index) ? t : [...t, res.turn!]));
        if (res.done) {
          setPhase("report");
          const rep = await writeReport(simId);
          if (!rep.ok) setError(rep.message);
          setPhase("done");
          setRunning(false);
          router.refresh();
          break;
        }
      }
      loop.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [running, simId, router]);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [turns.length]);

  useEffect(() => {
    if (driver || status !== "RUNNING") return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [driver, status, router]);

  const live = running || phase === "report";
  const nextSpeaker = people[turns.length % people.length];

  async function endEarly() {
    setRunning(false);
    setPhase("report");
    const rep = await writeReport(simId);
    if (!rep.ok) {
      setError(rep.message);
      setPhase("turns");
    } else setPhase("done");
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg-subtle px-4 py-2.5 font-mono text-2xs tracking-wider uppercase" aria-live="polite">
        <span className={cn("flex items-center gap-1.5", live ? "text-accent-text" : "text-fg-muted")}>
          <span className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-accent" : "bg-fg-subtle")} />
          {phase === "stopped" ? "Stopped" : phase === "done" ? "Finished" : phase === "report" ? "Writing notes" : running ? "Live" : "Paused"}
        </span>
        <span className="text-fg-muted">Simulation</span>
        {demo && <span className="text-fg-muted">Demo agents · no API key</span>}
        <span className="ml-auto text-fg-muted">
          Turn {pad(turns.length)}/{pad(maxTurns)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2.5">
        {people.map((p) => {
          const speaking = running && nextSpeaker?.id === p.id;
          return (
            <span key={p.id} className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 text-xs", speaking ? "bg-accent-soft text-accent-text" : "text-fg-muted")}>
              <Avatar name={p.name} size="sm" />
              {p.name.split(" ")[0]}&apos;s Self{speaking && " · speaking"}
            </span>
          );
        })}
      </div>

      <ol className="flex min-h-48 flex-col divide-y divide-border">
        {turns.length === 0 && <li className="px-4 py-10 text-sm text-fg-muted">{running ? "The room is getting settled…" : "Nothing said yet."}</li>}
        {turns.map((t) => (
          <li key={t.index} className="flex animate-[fade-in_300ms_ease-out] gap-3 px-4 py-4">
            <Avatar name={t.speaker} size="md" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-fg-subtle">
                <span className="font-medium text-fg">{t.speaker.split(" ")[0]}&apos;s Self</span> · turn {t.index + 1}
              </p>
              <p className="mt-1 text-base leading-relaxed">{t.text}</p>
            </div>
          </li>
        ))}
        <div ref={bottom} />
      </ol>

      {driver && phase === "turns" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          {running ? (
            <Button variant="ghost" onClick={() => setRunning(false)}>
              Pause
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                setError(null);
                setRunning(true);
              }}
            >
              {turns.length ? "Resume" : "Start"}
            </Button>
          )}
          {turns.length >= people.length && (
            <Button variant="ghost" onClick={endEarly}>
              End now and write notes
            </Button>
          )}
        </div>
      )}
      <p className="border-t border-border px-4 py-2.5 text-xs text-fg-subtle">
        A simulated conversation between AI stand-ins built from each person&apos;s approved persona. Not the real people, and not a verdict on anyone.
      </p>
      {error && <p className="border-t border-border px-4 py-2.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
