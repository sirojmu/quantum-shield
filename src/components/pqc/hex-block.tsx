"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

interface HexBlockProps {
  label: string;
  value?: string;
  byteCount?: number;
  variant?: "default" | "secret" | "primary";
  className?: string;
  emptyHint?: string;
}

function formatBytes(n: number | undefined): string {
  if (n === undefined) return "—";
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KB`;
}

export function HexBlock({
  label,
  value,
  byteCount,
  variant = "default",
  className,
  emptyHint = "Result will appear here after running the operation.",
}: HexBlockProps) {
  const accent =
    variant === "secret"
      ? "text-amber-500"
      : variant === "primary"
        ? "text-emerald-500"
        : "text-emerald-500";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full bg-current", accent)} />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {value && byteCount !== undefined && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatBytes(byteCount)} · {value.length / 2} bytes
            </span>
          )}
          <CopyButton value={value ?? ""} label="" />
        </div>
      </div>
      <div
        className={cn(
          "max-h-40 overflow-y-auto rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-[11px] leading-relaxed break-all transition-colors",
          !value && "text-muted-foreground/50",
        )}
        style={{ scrollbarWidth: "thin" }}
      >
        {value ? (
          <span className="text-foreground/90">{value}</span>
        ) : (
          <span className="italic">{emptyHint}</span>
        )}
      </div>
    </div>
  );
}
