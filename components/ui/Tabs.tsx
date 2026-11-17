"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils/format";

/**
 * Client-side tabs over server-rendered panels: every panel is rendered on the
 * server and passed in, so switching tabs costs no extra requests.
 */
export function Tabs({ tabs, className }: { tabs: { label: string; content: ReactNode }[]; className?: string }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return (
    <div className={className}>
      <div role="tablist" className="mb-2 flex gap-1 rounded-lg bg-elevated p-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            onClick={() => setActive(i)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition",
              i === active ? "bg-raised text-fg shadow" : "text-subtle hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.label}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
