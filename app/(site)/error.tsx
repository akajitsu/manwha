"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="mb-4 size-8 text-danger" aria-hidden />
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        We couldn&apos;t load this page. MangaDex may be busy — please try again.
      </p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-subtle">Ref: {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-ink hover:bg-accent-strong"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-fg hover:border-fg/40">
          Go home
        </Link>
      </div>
    </div>
  );
}
