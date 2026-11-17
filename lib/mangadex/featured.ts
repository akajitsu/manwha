import "server-only";

import { cacheLife } from "next/cache";

import type { FeaturedItem } from "@/types/manga";

import { getRecentUpdates } from "./chapters";
import { getStatistics } from "./manga";

/**
 * Featured titles: series that received readable English chapters most
 * recently, ranked by their MangaDex follower count. This guarantees every
 * "Read now" button opens a chapter that is actually hosted on MangaDex.
 */
export async function getFeatured(count = 6): Promise<FeaturedItem[]> {
  "use cache";
  cacheLife("hours");

  const pages = await Promise.all([getRecentUpdates(1), getRecentUpdates(2)]);
  const seen = new Set<string>();
  const candidates = pages
    .flatMap((p) => p.updates)
    .filter((u) => {
      if (seen.has(u.manga.id) || !u.manga.cover || !u.chapters[0]) return false;
      seen.add(u.manga.id);
      return true;
    });
  const stats = await getStatistics(candidates.map((c) => c.manga.id));

  return candidates
    .map((c) => ({ manga: c.manga, latest: c.chapters[0], stats: stats[c.manga.id] ?? null }))
    .sort((a, b) => (b.stats?.follows ?? 0) - (a.stats?.follows ?? 0))
    .slice(0, count);
}
