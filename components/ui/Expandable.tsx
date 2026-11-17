"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils/format";

/** Collapses long server-rendered content behind a "Show more" toggle. */
export function Expandable({ children, collapsedHeight = "9rem" }: { children: ReactNode; collapsedHeight?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className={cn("relative overflow-hidden", !open && "mask-b-from-40%")}
        style={open ? undefined : { maxHeight: collapsedHeight }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent hover:text-accent-strong"
      >
        {open ? "Show less" : "Show more"}
        <ChevronDown className={cn("size-3.5 transition", open && "rotate-180")} aria-hidden />
      </button>
    </div>
  );
}
