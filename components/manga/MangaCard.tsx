import Link from "next/link";

import { DEFAULT_LANGUAGE } from "@/constants/site";
import { chapterShortLabel } from "@/lib/utils/format";
import type { Chapter, MangaStats, MangaSummary } from "@/types/manga";

import { RatingBadge, StatusBadge, TypeBadge } from "./badges";
import { CoverImage } from "./CoverImage";

export function MangaCard({
  manga,
  latest,
  stats,
  priority = false,
  showGenres = true,
  rank,
}: {
  manga: MangaSummary;
  latest?: Chapter | null;
  stats?: MangaStats | null;
  priority?: boolean;
  showGenres?: boolean;
  rank?: number;
}) {
  return (
    <Link
      href={`/manga/${manga.id}`}
      className="group flex flex-col outline-none"
      aria-label={manga.title}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-elevated ring-1 ring-line transition duration-300 group-hover:ring-accent/60 group-focus-visible:ring-2 group-focus-visible:ring-accent">
        <CoverImage
          src={manga.cover?.medium}
          alt={`${manga.title} cover`}
          priority={priority}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 190px"
          className="transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/80 to-transparent" />
        <StatusBadge status={manga.status} overlay className="absolute left-1.5 top-1.5" />
        <TypeBadge originalLanguage={manga.originalLanguage} className="absolute bottom-1.5 left-1.5" />
        {rank !== undefined && (
          <span
            className={`absolute bottom-0 right-1.5 text-4xl font-black italic leading-none tabular-nums drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] ${rank <= 3 ? "text-accent" : "text-white/90"}`}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </span>
        )}
      </div>

      <div className="mt-2 flex min-w-0 flex-1 flex-col gap-1 px-0.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-fg transition group-hover:text-accent sm:text-sm">
          {manga.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 text-xs">
          {latest ? (
            <span className="truncate text-muted">
              {chapterShortLabel(latest)}
              {latest.language !== DEFAULT_LANGUAGE && (
                <span className="ml-1 text-[10px] uppercase text-subtle">{latest.language}</span>
              )}
            </span>
          ) : (
            <span className="truncate text-subtle">{manga.year ?? ""}</span>
          )}
          <RatingBadge rating={stats?.rating} />
        </div>
        {showGenres && manga.genres.length > 0 && (
          <p className="hidden truncate text-[11px] text-subtle sm:block">
            {manga.genres.slice(0, 3).map((g) => g.name).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}

export function MangaCardSkeleton({ showGenres = true }: { showGenres?: boolean }) {
  return (
    <div className="flex flex-col" aria-hidden>
      <div className="skeleton aspect-[2/3] rounded-lg" />
      <div className="skeleton mt-2 h-3.5 w-11/12 rounded" />
      <div className="skeleton mt-1.5 h-3 w-1/2 rounded" />
      {showGenres && <div className="skeleton mt-1.5 hidden h-2.5 w-2/3 rounded sm:block" />}
    </div>
  );
}

export const GRID_CLASSES =
  "grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export function MangaGridSkeleton({ count = 18, className = GRID_CLASSES }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <MangaCardSkeleton key={i} />
      ))}
    </div>
  );
}
