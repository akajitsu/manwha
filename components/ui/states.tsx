import { AlertTriangle, SearchX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/format";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-elevated text-muted">
        {icon ?? <SearchX className="size-5" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this section",
  description = "MangaDex may be busy or temporarily unreachable. Please try again in a moment.",
  retryHref,
  className,
}: {
  title?: string;
  description?: string;
  retryHref?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-danger/25 bg-danger/5 px-6 py-10 text-center",
        className,
      )}
    >
      <AlertTriangle className="mb-3 size-6 text-danger" aria-hidden />
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {retryHref && (
        <Link
          href={retryHref}
          className="mt-4 rounded-md border border-line-strong px-3 py-1.5 text-sm font-medium text-fg transition hover:border-accent hover:text-accent"
        >
          Try again
        </Link>
      )}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel = "View all",
  icon,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg sm:text-xl">
          {icon && <span className="text-accent">{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-subtle sm:text-sm">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted transition hover:text-accent"
        >
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}
