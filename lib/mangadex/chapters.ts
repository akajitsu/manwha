import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { REMOVED_GROUP_IDS, isRemovedChapter, isRemovedManga } from "@/constants/removals";
import { DEFAULT_LANGUAGE } from "@/constants/site";
import type { Chapter, MangaSummary, Paginated, RecentUpdate } from "@/types/manga";
import type { MdChapter, MdCollection, MdEntity, MdMangaAttributes } from "@/types/mangadex";

import { MangaDexError, mdGet } from "./client";
import { LISTING_CONTENT_RATINGS, MAX_RESULT_WINDOW, getMangaByIds } from "./manga";
import { mapChapter, pickTitle } from "./mappers";

const ALL_RATINGS = ["safe", "suggestive", "erotica", "pornographic"];

/** Honors scanlation-group removal requests upstream (see constants/removals.ts). */
const EXCLUDED_GROUPS = REMOVED_GROUP_IDS.length ? [...REMOVED_GROUP_IDS] : undefined;

/** Recently published, readable chapters, grouped by series. */
export async function getRecentUpdates(
  page = 1,
  maxSeries = 40,
): Promise<{ updates: RecentUpdate[]; hasMore: boolean }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("recent-updates");

  const limit = 100;
  const offset = Math.min((Math.max(page, 1) - 1) * limit, MAX_RESULT_WINDOW - limit);
  const res = await mdGet<MdCollection<MdChapter>>("/chapter", {
    limit,
    offset,
    translatedLanguage: [DEFAULT_LANGUAGE],
    contentRating: [...LISTING_CONTENT_RATINGS],
    includes: ["scanlation_group"],
    includeExternalUrl: 0,
    includeEmptyPages: 0,
    includeFuturePublishAt: 0,
    excludedGroups: EXCLUDED_GROUPS,
    order: { readableAt: "desc" },
  });

  // Group by manga, preserving recency order and dropping duplicate chapter
  // numbers released by multiple groups.
  const grouped = new Map<string, Chapter[]>();
  for (const raw of res.data) {
    const ch = mapChapter(raw);
    if (!ch.mangaId || isRemovedChapter(ch) || isRemovedManga(ch.mangaId)) continue;
    const list = grouped.get(ch.mangaId) ?? [];
    if (!grouped.has(ch.mangaId)) {
      if (grouped.size >= maxSeries) continue;
      grouped.set(ch.mangaId, list);
    }
    if (list.length < 3 && !list.some((c) => c.number === ch.number && c.number !== null)) list.push(ch);
  }

  const mangas = await getMangaByIds([...grouped.keys()]);
  const byId = new Map<string, MangaSummary>(mangas.map((m) => [m.id, m]));
  const updates: RecentUpdate[] = [];
  for (const [mangaId, chapters] of grouped) {
    const manga = byId.get(mangaId);
    if (manga) updates.push({ manga, chapters });
  }

  return { updates, hasMore: res.offset + res.limit < Math.min(res.total, MAX_RESULT_WINDOW) };
}

export type ChapterOrder = "asc" | "desc";

/** A page of a title's chapter list in one language (includes official external chapters). */
export async function getMangaFeed(
  mangaId: string,
  opts: { language?: string; order?: ChapterOrder; limit?: number; offset?: number } = {},
): Promise<Paginated<Chapter>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`feed-${mangaId}`);

  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const offset = Math.min(Math.max(opts.offset ?? 0, 0), MAX_RESULT_WINDOW - limit);
  const order = opts.order ?? "desc";
  const res = await mdGet<MdCollection<MdChapter>>(`/manga/${mangaId}/feed`, {
    limit,
    offset,
    translatedLanguage: [opts.language ?? DEFAULT_LANGUAGE],
    contentRating: ALL_RATINGS,
    includes: ["scanlation_group"],
    includeFuturePublishAt: 0,
    excludedGroups: EXCLUDED_GROUPS,
    order: { volume: order, chapter: order },
  });
  const items = res.data.map(mapChapter).filter((c) => !isRemovedChapter(c));
  return { items, total: res.total, limit: res.limit, offset: res.offset };
}

/** First readable (hosted on MangaDex) chapter in a language, if any. */
export async function getFirstReadableChapter(mangaId: string, language = DEFAULT_LANGUAGE): Promise<Chapter | null> {
  "use cache";
  cacheLife("hours");

  const res = await mdGet<MdCollection<MdChapter>>(`/manga/${mangaId}/feed`, {
    limit: 1,
    translatedLanguage: [language],
    contentRating: ALL_RATINGS,
    includeExternalUrl: 0,
    includeEmptyPages: 0,
    includeFuturePublishAt: 0,
    excludedGroups: EXCLUDED_GROUPS,
    order: { volume: "asc", chapter: "asc" },
  });
  return res.data[0] ? mapChapter(res.data[0]) : null;
}

export interface ChapterWithManga {
  chapter: Chapter;
  manga: { id: string; title: string; contentRating: string } | null;
}

/** A single chapter with its series and scanlation groups. */
export async function getChapter(id: string): Promise<ChapterWithManga | null> {
  "use cache";
  cacheLife("hours");

  try {
    const res = await mdGet<MdEntity<MdChapter>>(`/chapter/${id}`, {
      includes: ["scanlation_group", "manga"],
    });
    const chapter = mapChapter(res.data);
    const mangaRel = res.data.relationships.find((r) => r.type === "manga");
    const attrs = mangaRel?.attributes as MdMangaAttributes | undefined;
    return {
      chapter,
      manga: mangaRel && attrs ? { id: mangaRel.id, title: pickTitle(attrs), contentRating: attrs.contentRating } : null,
    };
  } catch (err) {
    if (err instanceof MangaDexError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export interface ChapterNavItem {
  id: string;
  number: string | null;
  volume: string | null;
  title: string | null;
  groupIds: string[];
  groupName: string;
}

/**
 * Every readable chapter of a title in one language, ascending, used for the
 * reader's chapter selector and previous/next navigation. Pages through the
 * feed 500 at a time (the documented maximum) with a hard cap.
 */
export async function getReadableChapterList(mangaId: string, language = DEFAULT_LANGUAGE): Promise<ChapterNavItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`feed-${mangaId}`);

  const out: ChapterNavItem[] = [];
  const pageSize = 500;
  for (let offset = 0; offset < 2500; offset += pageSize) {
    const res = await mdGet<MdCollection<MdChapter>>(`/manga/${mangaId}/feed`, {
      limit: pageSize,
      offset,
      translatedLanguage: [language],
      contentRating: ALL_RATINGS,
      includes: ["scanlation_group"],
      includeExternalUrl: 0,
      includeEmptyPages: 0,
      includeFuturePublishAt: 0,
      excludedGroups: EXCLUDED_GROUPS,
      order: { volume: "asc", chapter: "asc" },
    });
    for (const raw of res.data) {
      const ch = mapChapter(raw);
      if (isRemovedChapter(ch)) continue;
      out.push({
        id: ch.id,
        number: ch.number,
        volume: ch.volume,
        title: ch.title,
        groupIds: ch.groups.map((g) => g.id),
        groupName: ch.groups.map((g) => g.name).join(", ") || "No group",
      });
    }
    if (res.offset + res.limit >= res.total) break;
  }
  return out;
}

/** Batch lookup of chapters by id (used for "latest chapter" labels on cards). */
export async function getChaptersByIds(ids: string[]): Promise<Record<string, Chapter>> {
  "use cache";
  cacheLife("minutes");

  const unique = [...new Set(ids.filter(Boolean))].sort().slice(0, 100);
  if (unique.length === 0) return {};
  const res = await mdGet<MdCollection<MdChapter>>("/chapter", {
    ids: unique,
    limit: unique.length,
    contentRating: ALL_RATINGS,
    includeFuturePublishAt: 0,
  });
  const out: Record<string, Chapter> = {};
  for (const raw of res.data) out[raw.id] = mapChapter(raw);
  return out;
}
