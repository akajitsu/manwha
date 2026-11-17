import { Users } from "lucide-react";
import Link from "next/link";

import { comicTypeLabel } from "@/constants/site";
import { cn, formatCompact } from "@/lib/utils/format";
import type { MangaStats, MangaSummary } from "@/types/manga";

import { RatingBadge } from "./badges";
import { CoverImage } from "./CoverImage";

const RANK_COLORS = ["text-accent", "text-fg", "text-[#d08a5a]"];

/** Numbered ranking (sidebar style). Ranks come from MangaDex follow counts. */
export function RankingList({
  items,
  stats,
  startRank = 1,
}: {
  items: MangaSummary[];
  stats: Record<string, MangaStats>;
  startRank?: number;
}) {
  return (
    <ol className="divide-y divide-line">
      {items.map((manga, i) => {
        const rank = startRank + i;
        const s = stats[manga.id];
        return (
          <li key={manga.id}>
            <Link href={`/manga/${manga.id}`} className="group flex items-center gap-3 py-2.5">
              <span
                className={cn(
                  "w-7 shrink-0 text-center text-xl font-black tabular-nums",
                  RANK_COLORS[rank - 1] ?? "text-subtle",
                )}
              >
                {rank}
              </span>
              <span className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-elevated">
                <CoverImage src={manga.cover?.thumb} alt="" sizes="48px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-fg transition group-hover:text-accent">
                  {manga.title}
                </span>
                <span className="mt-1 flex items-center gap-2.5 text-[11px] text-subtle">
                  <span className="font-semibold uppercase">{comicTypeLabel(manga.originalLanguage)}</span>
                  {s?.follows ? (
                    <span className="inline-flex items-center gap-1" title="MangaDex follows">
                      <Users className="size-3" aria-hidden />
                      {formatCompact(s.follows)}
                    </span>
                  ) : null}
                  <RatingBadge rating={s?.rating} className="text-[11px]" />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function RankingListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="divide-y divide-line" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <div className="skeleton h-5 w-7 rounded" />
          <div className="skeleton aspect-[2/3] w-12 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-4/5 rounded" />
            <div className="skeleton h-2.5 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
