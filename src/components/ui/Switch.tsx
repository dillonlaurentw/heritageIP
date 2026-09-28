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
      className="relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full bg-border-strong p-0.5 transition-colors duration-(--duration-fast) data-checked:bg-accent disabled:opacity-50"
    >
      <S.Thumb className="size-3.5 rounded-full bg-white shadow-popover transition-transform duration-(--duration-fast) data-checked:translate-x-3.5" />
    </S.Root>
  );
}
