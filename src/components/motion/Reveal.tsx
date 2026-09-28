"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { duration, ease, maxStaggerDelay, stagger } from "@/design/motion";

/**
 * Slide + fade in when scrolled into view. Pass `index` for staggered
 * siblings (tiles in a mosaic). Reduced motion: opacity only, no travel.
 */
export function Reveal({
  children,
  index = 0,
  className,
  y = 32,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: reduce ? duration.fast : duration.slow,
        ease: ease.outStrong,
        delay: reduce ? 0 : Math.min(index * stagger, maxStaggerDelay),
      }}
    >
      {children}
    </motion.div>
  );
}
