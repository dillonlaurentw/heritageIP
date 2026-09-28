/**
 * Motion values for JS-driven animation (motion/react). These mirror the
 * --ease-* and --duration-* tokens in tokens.css. Change both together.
 */
export const ease = {
  outStrong: [0.16, 1, 0.3, 1],
  inOutStrong: [0.76, 0, 0.24, 1],
} as const;

/** Seconds, because motion/react takes seconds. */
export const duration = {
  fast: 0.2,
  base: 0.4,
  slow: 0.6,
} as const;

/** Delay between siblings in a staggered reveal. */
export const stagger = 0.06;

/** Cap total stagger so long lists never feel slow. */
export const maxStaggerDelay = 0.36;
