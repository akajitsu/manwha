"use client";

import { History } from "lucide-react";
import Link from "next/link";

import { SectionHeader } from "@/components/ui/states";
import { useLibrary } from "@/hooks/useLibrary";

import { CoverImage } from "./CoverImage";

/** Client-only row of in-progress series from local reading history. */
export function ContinueReading({ limit = 8 }: { limit?: number }) {
  const { history } = useLibrary();
  if (history.length === 0) return null;

  return (
    <section className="mt-8">
      <SectionHeader title="Continue reading" icon={<History className="size-5" />} href="/library?tab=history" hrefLabel="History" />
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {history.slice(0, limit).map((h) => (
          <Link
            key={h.mangaId}
            href={`/read/${h.chapterId}`}
            className="group w-[132px] shrink-0 snap-start sm:w-[150px]"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-elevated ring-1 ring-line transition group-hover:ring-accent/60">
              <CoverImage src={h.cover} alt={`${h.title} cover`} sizes="150px" />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent px-2 pb-2 pt-8">
                <span className="text-xs font-semibold text-fg">{h.chapterLabel}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
                <div className="h-full bg-accent" style={{ width: `${Math.round(h.progress * 100)}%` }} />
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug text-fg transition group-hover:text-accent">
              {h.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
