"use client";

import { motion, useReducedMotion } from "motion/react";
import { duration, ease } from "@/design/motion";

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * Big type, revealed line by line from behind a mask. You choose the line
 * breaks (pass one string per line) because display type should break where
 * the meaning breaks, not wherever the browser wraps.
 */
export function MaskedLines({
  lines,
  as: As = "h1",
  className = "",
  delay = 0,
  onView = false,
}: {
  lines: string[];
  as?: Tag;
  className?: string;
  delay?: number;
  /** Animate when scrolled into view instead of on mount. */
  onView?: boolean;
}) {
  const reduce = useReducedMotion();
  const trigger = onView ? "whileInView" : "animate";

  return (
    <As className={className} aria-label={lines.join(" ")}>
      {lines.map((line, i) => (
        <span
          key={i}
          aria-hidden
          // pb/-mb gives descenders room inside the mask
          className="-mb-[0.12em] block overflow-hidden pb-[0.12em]"
        >
          <motion.span
            className="block"
            initial={reduce ? { opacity: 0 } : { y: "105%" }}
            {...{ [trigger]: reduce ? { opacity: 1 } : { y: "0%" } }}
            viewport={{ once: true }}
            transition={{
              duration: reduce ? duration.fast : duration.slow,
              ease: ease.outStrong,
              delay: reduce ? 0 : delay + i * 0.08,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </As>
  );
}
