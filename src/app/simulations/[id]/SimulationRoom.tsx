"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nextTurn, writeReport } from "../actions";
import { Button } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { duration, ease } from "@/design/motion";

type Turn = { index: number; speakerId: string; speaker: string; text: string };
type Person = { id: string; name: string };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The control room. The initiator's browser drives the simulation one turn
 * per request, so it can be watched live, paused, or ended early. Everyone
 * else sees it refresh as turns land.
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
  const reduce = useReducedMotion();
  const [driven, setTurns] = useState(initialTurns);
  // The driver's own state is authoritative; everyone else reads fresh server data.
  const turns = driver ? driven : initialTurns;
  const max = maxTurns;
  const [running, setRunning] = useState(driver && status === "RUNNING" && !hasReport);
  const [localPhase, setPhase] = useState<"turns" | "report" | "done" | "stopped">(hasReport ? "done" : "turns");
  // The server's status wins: once stopped or reported, it stays that way.
  const phase = status === "CANCELLED" ? "stopped" : hasReport ? "done" : localPhase;
  const [error, setError] = useState<string | null>(null);
  const loop = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  // Drive the loop: one turn per request until done, paused, or stopped.
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

  // Keep the newest turn in view.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [turns.length, reduce]);

  // Viewers who aren't driving see progress by refreshing.
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
    <div className="mx-edge border border-line">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-3" aria-live="polite">
        <div className="flex flex-wrap items-center gap-6">
          <Label live={live} tone={live ? "signal" : "smoke"}>
            {phase === "stopped" ? "Stopped" : phase === "done" ? "Finished" : phase === "report" ? "Writing notes" : running ? "Live" : "Paused"}
          </Label>
          <Label tone="bone">Simulation</Label>
          {demo && <Label tone="signal">Demo agents · No API key</Label>}
        </div>
        <Label tone="bone">
          Turn {pad(turns.length)}/{pad(max)}
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_16rem]">
        <ol className="min-h-72 divide-y divide-line">
          {turns.length === 0 && (
            <li className="px-4 py-10 text-lead text-smoke">{running ? "The room is getting settled…" : "Nothing said yet."}</li>
          )}
          <AnimatePresence initial={false}>
            {turns.map((t) => (
              <motion.li
                key={t.index}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.base, ease: ease.outStrong }}
                className="grid grid-cols-1 gap-2 px-4 py-5 sm:grid-cols-[10rem_1fr] sm:gap-4"
              >
                <div className="flex flex-col gap-1">
                  <Label tone="bone">{t.speaker.split(" ")[0]} · Agent</Label>
                  <Label>Turn {pad(t.index + 1)}</Label>
                </div>
                <p className="measure text-lead">{t.text}</p>
              </motion.li>
            ))}
          </AnimatePresence>
          <div ref={bottom} />
        </ol>

        <div className="border-t border-line md:border-t-0 md:border-l">
          {people.map((p, i) => {
            const speaking = running && nextSpeaker?.id === p.id;
            return (
              <div key={p.id} className="flex items-center justify-between border-b border-line px-4 py-3">
                <Label tone="bone">
                  {pad(i + 1)} · {p.name.split(" ")[0]}
                </Label>
                <Label live={speaking} tone={speaking ? "signal" : "smoke"}>
                  {speaking ? "Speaking" : "Stand-in"}
                </Label>
              </div>
            );
          })}
          {driver && phase === "turns" && (
            <div className="flex flex-col items-start gap-3 px-4 py-4">
              {running ? (
                <button type="button" onClick={() => setRunning(false)} className="text-small font-medium text-smoke hover:text-bone">
                  Pause
                </button>
              ) : (
                <Button onClick={() => { setError(null); setRunning(true); }} variant="ghost">
                  {turns.length ? "Resume" : "Start"}
                </Button>
              )}
              {turns.length >= people.length && (
                <button type="button" onClick={endEarly} className="text-small font-medium text-smoke hover:text-bone">
                  End now and write notes
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <Label>Simulated conversation between AI stand-ins built from each person&apos;s approved persona. Not the real people, and not a verdict on anyone.</Label>
      </div>
      {error && <p className="label border-t border-line px-4 py-3 text-signal">{error}</p>}
    </div>
  );
}
