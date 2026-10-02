"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

/** A quiet code block with a copy button. Plain text: no highlighting theme to fight with. */
export function Code({ code, label, className }: { code: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={cn("group relative overflow-hidden rounded-lg bg-bg-inset", className)}>
      {label && <div className="border-b border-border px-4 py-2 font-mono text-2xs tracking-wide text-fg-subtle uppercase">{label}</div>}
      <button
        type="button"
        aria-label="Copy"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="absolute top-2 right-2 rounded-md p-1.5 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-hover hover:text-fg focus-visible:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
      <pre className="scroll-quiet overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.65] text-fg">
        <code>{code}</code>
      </pre>
    </div>
  );
}
