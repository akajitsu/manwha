"use client";

import { ImageOff, RotateCw } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils/format";

/**
 * One chapter page. Holds a tall placeholder until the image arrives so the
 * lazy-loading pipeline and scroll position stay stable, and offers a retry
 * on failure (the proxy re-resolves the MangaDex@Home server when needed).
 */
export function ReaderPage({
  src,
  pageNumber,
  total,
  eager,
}: {
  src: string;
  pageNumber: number;
  total: number;
  eager: boolean;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const url = attempt > 0 ? `${src}?retry=${attempt}` : src;

  return (
    <div
      id={`page-${pageNumber}`}
      data-page={pageNumber}
      className={cn("relative w-full", status !== "loaded" && "min-h-[70vh] bg-surface")}
    >
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center" aria-hidden>
          <div className="flex flex-col items-center gap-3 text-subtle">
            <div className="size-8 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
            <span className="text-xs tabular-nums">
              {pageNumber} / {total}
            </span>
          </div>
        </div>
      )}

      {status === "error" ? (
        <div className="absolute inset-0 grid place-items-center p-6" role="alert">
          <div className="flex flex-col items-center gap-3 text-center">
            <ImageOff className="size-8 text-subtle" aria-hidden />
            <p className="text-sm text-muted">Page {pageNumber} failed to load.</p>
            <button
              type="button"
              onClick={() => {
                setStatus("loading");
                setAttempt((a) => a + 1);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-fg transition hover:border-accent hover:text-accent"
            >
              <RotateCw className="size-4" aria-hidden /> Retry
            </button>
          </div>
        </div>
      ) : (
        // Intrinsic page dimensions are unknown until load, so a plain <img> is
        // used; the proxy already serves the exact asset MangaDex provides.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={`Page ${pageNumber}`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={pageNumber === 1 ? "high" : "auto"}
          draggable={false}
          onLoad={() => setStatus("loaded")}
          onError={() => {
            // One silent retry (the proxy re-resolves the image server on
            // failure) before asking the reader to retry manually.
            if (attempt === 0) setTimeout(() => setAttempt(1), 1500);
            else setStatus("error");
          }}
          className={cn(
            "mx-auto block h-auto w-full select-none",
            status === "loading" && "absolute inset-x-0 top-0 opacity-0",
          )}
        />
      )}
    </div>
  );
}
