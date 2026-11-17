"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ReaderError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="mb-4 size-8 text-danger" aria-hidden />
      <h1 className="text-xl font-bold">This chapter couldn&apos;t be opened</h1>
      <p className="mt-2 max-w-md text-sm text-muted">MangaDex may be busy. Please try again in a moment.</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-ink hover:bg-accent-strong"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-fg">
          Go home
        </Link>
      </div>
    </div>
  );
}
