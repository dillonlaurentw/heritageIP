import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-md border border-border bg-surface px-3 text-base text-fg outline-none transition-colors duration-(--duration-fast) placeholder:text-fg-subtle hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent-soft disabled:opacity-60 aria-invalid:border-danger";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(field, "h-9", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-20 py-2 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, ...rest }: ComponentProps<"select">) {
  return <select className={cn(field, "h-9 pr-7", className)} {...rest} />;
}

/** Label + control + hint/error, stacked. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-sm font-medium text-fg">{label}</span>}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="text-xs text-fg-muted">{hint}</span>
      )}
    </label>
  );
}
