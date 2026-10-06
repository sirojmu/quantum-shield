"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  label?: string;
}

export function CopyButton({ value, label, className, ...props }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for restricted environments
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {label ?? (copied ? "Copied" : "Copy")}
    </button>
  );
}
