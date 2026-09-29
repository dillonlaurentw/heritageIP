"use client";

import { Switch as S } from "@base-ui/react/switch";

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  name,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <S.Root
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v)}
      disabled={disabled}
      name={name}
      aria-label={label}
      className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-border-strong p-0.5 transition-colors duration-(--duration-fast) data-checked:bg-primary disabled:opacity-50"
    >
      <S.Thumb className="size-5 rounded-full bg-surface shadow-popover transition-transform duration-(--duration-fast) data-checked:translate-x-4" />
    </S.Root>
  );
}
