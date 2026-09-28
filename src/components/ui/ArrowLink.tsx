import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

type Size = "hero" | "lead" | "inline";

const sizeClass: Record<Size, string> = {
  hero: "type-display text-headline",
  lead: "text-lead font-semibold tracking-tight",
  inline: "text-body font-medium",
};

/**
 * The SELF CTA: words + an arrow that pushes forward on hover.
 * Never a pill. `tone="signal"` for the one primary action on a screen.
 */
export function ArrowLink<T extends string>({
  href,
  children,
  size = "lead",
  tone = "bone",
  className = "",
}: {
  href: Route<T>;
  children: ReactNode;
  size?: Size;
  tone?: "bone" | "signal" | "field";
  className?: string;
}) {
  const toneClass = tone === "signal" ? "text-signal" : tone === "field" ? "text-field" : "text-bone";
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      className={`group inline-block ${sizeClass[size]} ${toneClass} ${className}`}
    >
      {/* Inline (not flex) so the arrow follows the last word when a line wraps. */}
      <span className="underline decoration-transparent decoration-1 underline-offset-[0.14em] transition-[text-decoration-color] duration-(--duration-base) ease-out-strong group-hover:decoration-current">
        {children}
      </span>
      {" "}
      <Arrow />
    </Link>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block transition-transform duration-(--duration-fast) ease-out-strong motion-safe:group-hover:translate-x-[0.25em] ${className}`}
    >
      →
    </span>
  );
}

/** Button for forms and actions. Square, flat, no shadow. */
export function Button({
  children,
  variant = "signal",
  type = "button",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "signal" | "ghost" }) {
  const v =
    variant === "signal"
      ? "bg-signal text-field hover:bg-bone"
      : "border border-line text-bone hover:border-bone";
  return (
    <button
      type={type}
      {...rest}
      className={`group inline-flex items-center gap-3 rounded-xs px-5 py-3 text-body font-semibold tracking-tight transition-colors duration-(--duration-fast) ease-out-strong disabled:opacity-40 ${v} ${rest.className ?? ""}`}
    >
      {children}
      <Arrow />
    </button>
  );
}
