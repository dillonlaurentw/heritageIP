"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Sizes its text to fill the space it's given without overflowing, so a
 * poem of any length fits the screen without scrolling. The largest size
 * that fits is found by halving, and found again whenever the space changes.
 * With `columns`, two columns are tried too (on wide, short screens a long
 * poem reads larger that way) and whichever allows the bigger text wins.
 * The server renders `estimate` (a CSS length) so the first paint is close.
 */
export function FitText({
  children,
  estimate,
  max,
  min = 9,
  columns = false,
  className,
}: {
  children: ReactNode;
  estimate: string;
  max: { phone: number; wide: number };
  min?: number;
  columns?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const outer = box.current;
    const inner = text.current;
    if (!outer || !inner) return;

    const fits = () => inner.scrollHeight <= outer.clientHeight && inner.scrollWidth <= outer.clientWidth;

    // The largest font size (px) that fits with `count` columns.
    const largest = (count: number) => {
      inner.style.columnCount = count > 1 ? String(count) : "";
      let lo = min;
      let hi = window.innerWidth >= 768 ? max.wide : max.phone;
      inner.style.fontSize = `${hi}px`;
      if (fits()) return hi;
      while (hi - lo > 0.25) {
        const mid = (lo + hi) / 2;
        inner.style.fontSize = `${mid}px`;
        if (fits()) lo = mid;
        else hi = mid;
      }
      return lo;
    };

    const fit = () => {
      const one = largest(1);
      const two = columns && outer.clientWidth >= 640 && one < max.wide ? largest(2) : 0;
      // Two columns only when they make a real difference.
      const count = two > one + 2 ? 2 : 1;
      inner.style.columnCount = count > 1 ? "2" : "";
      inner.style.fontSize = `${count > 1 ? two : one}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [max.phone, max.wide, min, columns]);

  return (
    <div ref={box} className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
      <div ref={text} className={className} style={{ fontSize: estimate }}>
        {children}
      </div>
    </div>
  );
}
