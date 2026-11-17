import type { CardExtras } from "@/lib/mangadex";
import type { MangaSummary } from "@/types/manga";

import { GRID_CLASSES, MangaCard } from "./MangaCard";

export function MangaGrid({
  items,
  extras,
  className = GRID_CLASSES,
  priorityCount = 6,
  startRank,
}: {
  items: MangaSummary[];
  extras?: CardExtras;
  className?: string;
  priorityCount?: number;
  /** When set, cards display a rank badge starting at this number. */
  startRank?: number;
}) {
  return (
    <div className={className}>
      {items.map((manga, i) => (
        <MangaCard
          key={manga.id}
          manga={manga}
          priority={i < priorityCount}
          latest={manga.latestUploadedChapterId ? extras?.latest[manga.latestUploadedChapterId] : null}
          stats={extras?.stats[manga.id]}
          rank={startRank !== undefined ? startRank + i : undefined}
        />
      ))}
    </div>
  );
}
