import "server-only";

import type { Chapter, MangaStats, MangaSummary } from "@/types/manga";

import { getChaptersByIds } from "./chapters";
import { getStatistics } from "./manga";

export interface CardExtras {
  latest: Record<string, Chapter>;
  stats: Record<string, MangaStats>;
}

/**
 * Two batched requests per grid (chapters by id + statistics), regardless of
 * how many cards are shown. Failures degrade gracefully to cards without the
 * extra labels instead of failing the whole grid.
 */
export async function getCardExtras(mangas: MangaSummary[]): Promise<CardExtras> {
  if (mangas.length === 0) return { latest: {}, stats: {} };
  const chapterIds = mangas.map((m) => m.latestUploadedChapterId).filter((id): id is string => Boolean(id));
  const [latest, stats] = await Promise.all([
    getChaptersByIds(chapterIds).catch(() => ({}) as Record<string, Chapter>),
    getStatistics(mangas.map((m) => m.id)).catch(() => ({}) as Record<string, MangaStats>),
  ]);
  return { latest, stats };
}
