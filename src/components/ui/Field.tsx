"use client";

import { useLayoutEffect, useRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Label } from "./Label";

const base =
  "w-full bg-transparent border-0 border-b border-line rounded-none px-0 py-3 text-bone placeholder:text-smoke/70 outline-none transition-colors duration-(--duration-fast) focus:border-signal focus-visible:outline-none";

type Wrap = { label?: string; error?: string; hint?: string };

function Frame({ label, error, hint, children }: Wrap & { children: React.ReactNode }) {
  return (
    <label className="block">
      {label && <Label className="mb-1">{label}</Label>}
      {children}
      {(error || hint) && (
        <span className={`label mt-2 block ${error ? "text-signal" : "text-smoke"}`}>{error ?? hint}</span>
      )}
    </label>
  );
}

export function TextInput({ label, error, hint, scale = "body", className = "", ...rest }: Wrap & { scale?: "body" | "title" } & Omit<InputHTMLAttributes<HTMLInputElement>, "size">) {
  return (
    <Frame label={label} error={error} hint={hint}>
      <input {...rest} className={`${base} ${scale === "title" ? "text-title font-medium tracking-tight" : "text-lead"} ${className}`} />
    </Frame>
  );
}

/** Textarea that grows with its content. */
export function TextArea({ label, error, hint, scale = "body", className = "", ...rest }: Wrap & { scale?: "body" | "title" } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [rest.value]);
  return (
    <Frame label={label} error={error} hint={hint}>
      <textarea
        ref={ref}
        rows={scale === "title" ? 2 : 3}
        {...rest}
        className={`${base} resize-none ${scale === "title" ? "text-title font-medium tracking-tight" : "text-lead"} ${className}`}
      />
    </Frame>
  );
}
