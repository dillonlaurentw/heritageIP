import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap select-none transition-colors duration-(--duration-fast) disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "bg-surface text-fg shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-bg-hover",
  ghost: "text-fg-muted hover:bg-bg-hover hover:text-fg",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  xs: "h-6 px-2.5 text-xs",
  sm: "h-8 px-3.5 text-sm",
  md: "h-10 px-5 text-base",
  lg: "h-12 px-7 text-md",
};

const iconSizes: Record<Size, string> = { xs: "size-6", sm: "size-8", md: "size-10", lg: "size-12" };

export function buttonClass(variant: Variant = "secondary", size: Size = "sm", iconOnly = false) {
  return cn(base, variants[variant], iconOnly ? iconSizes[size] : sizes[size]);
}

export function Button({
  variant = "secondary",
  size = "sm",
  iconOnly = false,
  className,
  type = "button",
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; iconOnly?: boolean }) {
  return <button type={type} className={cn(buttonClass(variant, size, iconOnly), className)} {...rest} />;
}

export function LinkButton<T extends string>({
  href,
  variant = "secondary",
  size = "sm",
  className,
  children,
  ...rest
}: Omit<ComponentProps<typeof Link>, "href"> & { href: Route<T>; variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link href={href} className={cn(buttonClass(variant, size), className)} {...rest}>
      {children}
    </Link>
  );
}
