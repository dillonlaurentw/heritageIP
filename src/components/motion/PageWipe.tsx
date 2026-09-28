import { ViewTransition, type ReactNode } from "react";

/**
 * Wrap each page's content in this (in page.tsx, not a layout: layouts
 * persist across navigations so they never enter/exit). On navigation the
 * old page fades out fast and the new one wipes in from the right.
 * Reduced motion is handled in globals.css.
 */
export function PageWipe({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="wipe-in" exit="wipe-out" default="none">
      <main>{children}</main>
    </ViewTransition>
  );
}
