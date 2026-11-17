import Link from "next/link";

import { TimeAgo } from "@/components/ui/TimeAgo";
import { comicTypeLabel } from "@/constants/site";
import { chapterShortLabel } from "@/lib/utils/format";
import type { RecentUpdate } from "@/types/manga";

import { StatusBadge } from "./badges";
import { CoverImage } from "./CoverImage";

/** Compact "latest update" tile: cover + title + most recent chapters. */
export function UpdateCard({ update, priority = false }: { update: RecentUpdate; priority?: boolean }) {
  const { manga, chapters } = update;
  return (
    <article className="flex gap-3 rounded-xl border border-line bg-surface p-2.5 transition hover:border-line-strong">
      <Link
        href={`/manga/${manga.id}`}
        className="relative aspect-[2/3] w-[76px] shrink-0 overflow-hidden rounded-lg bg-elevated sm:w-[84px]"
        aria-label={manga.title}
      >
        <CoverImage src={manga.cover?.thumb} alt={`${manga.title} cover`} sizes="84px" priority={priority} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/manga/${manga.id}`}
          className="line-clamp-2 text-sm font-semibold leading-snug text-fg transition hover:text-accent"
        >
          {manga.title}
        </Link>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-subtle">
          <span className="font-semibold uppercase tracking-wide">{comicTypeLabel(manga.originalLanguage)}</span>
          <StatusBadge status={manga.status} className="px-1 py-0 text-[9px]" />
        </div>
        <ul className="mt-auto space-y-1 pt-2">
          {chapters.map((ch) => (
            <li key={ch.id}>
              <Link
                href={`/read/${ch.id}`}
                className="group flex items-center justify-between gap-2 rounded-md bg-elevated/70 px-2 py-1 text-xs transition hover:bg-raised"
              >
                <span className="truncate font-medium text-muted group-hover:text-fg">{chapterShortLabel(ch)}</span>
                <TimeAgo date={ch.publishedAt} className="shrink-0 text-[11px] text-subtle" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function UpdateCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-surface p-2.5" aria-hidden>
      <div className="skeleton aspect-[2/3] w-[76px] shrink-0 rounded-lg sm:w-[84px]" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-3.5 w-4/5 rounded" />
        <div className="skeleton h-2.5 w-1/3 rounded" />
        <div className="space-y-1.5 pt-3">
          <div className="skeleton h-6 rounded-md" />
          <div className="skeleton h-6 rounded-md" />
        </div>
      </div>
    </div>
  );
}
