import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { DEFAULT_LANGUAGE, SORT_OPTIONS, type SortValue } from "@/constants/site";
import type { MangaDetail, MangaStats, MangaSummary, Paginated, Tag } from "@/types/manga";
import type { MdCollection, MdEntity, MdManga, MdStatisticsResponse, MdTag } from "@/types/mangadex";

import { MangaDexError, mdGet } from "./client";
import { mapMangaDetail, mapMangaSummary, mapTag } from "./mappers";

/** Content ratings shown in listings. Explicit titles are not offered on BeanZz. */
export const LISTING_CONTENT_RATINGS = ["safe", "suggestive"] as const;
export const ALLOWED_CONTENT_RATINGS = new Set<string>(LISTING_CONTENT_RATINGS);

/** MangaDex rejects collection requests where offset + limit > 10,000. */
export const MAX_RESULT_WINDOW = 10_000;

export interface MangaQuery {
  title?: string;
  includedTags?: string[];
  excludedTags?: string[];
  status?: string[];
  originalLanguage?: string[];
  sort?: SortValue;
  limit?: number;
  offset?: number;
  /** Only titles added after N days ago. */
  createdWithinDays?: number;
  /** Only titles with chapters in the preferred language (default true). */
  requireTranslation?: boolean;
}

function isoNoTz(date: Date): string {
  return date.toISOString().slice(0, 19);
}

function clampWindow(limit: number, offset: number) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safeOffset = Math.min(Math.max(offset, 0), MAX_RESULT_WINDOW - safeLimit);
  return { limit: safeLimit, offset: safeOffset };
}

/** Search / browse the catalog. */
export async function searchManga(query: MangaQuery): Promise<Paginated<MangaSummary>> {
  "use cache";
  if (query.title) cacheLife("minutes");
  else cacheLife("hours");
  cacheTag("manga-list");

  const { limit, offset } = clampWindow(query.limit ?? 30, query.offset ?? 0);
  let sort: SortValue = query.sort ?? "latest";
  if (sort === "relevance" && !query.title) sort = "follows";
  const order = SORT_OPTIONS.find((o) => o.value === sort)?.order ?? { followedCount: "desc" };

  const createdAtSince = query.createdWithinDays
    ? isoNoTz(new Date(Date.now() - query.createdWithinDays * 86_400_000))
    : undefined;

  const res = await mdGet<MdCollection<MdManga>>("/manga", {
    title: query.title?.trim() || undefined,
    limit,
    offset,
    includes: ["cover_art"],
    contentRating: [...LISTING_CONTENT_RATINGS],
    includedTags: query.includedTags?.length ? [...query.includedTags].sort() : undefined,
    includedTagsMode: "AND",
    excludedTags: query.excludedTags?.length ? [...query.excludedTags].sort() : undefined,
    status: query.status?.length ? query.status : undefined,
    originalLanguage: query.originalLanguage?.length ? query.originalLanguage : undefined,
    availableTranslatedLanguage: query.requireTranslation === false ? undefined : [DEFAULT_LANGUAGE],
    hasAvailableChapters: query.requireTranslation === false ? undefined : "true",
    createdAtSince,
    order,
  });

  return {
    items: res.data.map(mapMangaSummary),
    total: Math.min(res.total, MAX_RESULT_WINDOW),
    limit: res.limit,
    offset: res.offset,
  };
}

/** Full manga record. Returns null when MangaDex has no such title. */
export async function getManga(id: string): Promise<MangaDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(`manga-${id}`);

  try {
    const res = await mdGet<MdEntity<MdManga>>(`/manga/${id}`, {
      includes: ["cover_art", "author", "artist"],
    });
    return mapMangaDetail(res.data);
  } catch (err) {
    if (err instanceof MangaDexError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

/** Batch lookup of many titles in one request (max 100). */
export async function getMangaByIds(ids: string[]): Promise<MangaSummary[]> {
  "use cache";
  cacheLife("hours");

  const unique = [...new Set(ids)].slice(0, 100);
  if (unique.length === 0) return [];
  const res = await mdGet<MdCollection<MdManga>>("/manga", {
    ids: unique,
    limit: unique.length,
    includes: ["cover_art"],
    contentRating: [...LISTING_CONTENT_RATINGS],
  });
  return res.data.map(mapMangaSummary);
}

/** All MangaDex tags, sorted by name. */
export async function getTags(): Promise<Tag[]> {
  "use cache";
  cacheLife("weeks");

  const res = await mdGet<MdCollection<MdTag>>("/manga/tag");
  return res.data.map(mapTag).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Official MangaDex community statistics (follows + Bayesian rating), batched.
 */
export async function getStatistics(ids: string[]): Promise<Record<string, MangaStats>> {
  "use cache";
  cacheLife("hours");

  const unique = [...new Set(ids)].sort();
  const out: Record<string, MangaStats> = {};
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const res = await mdGet<MdStatisticsResponse>("/statistics/manga", { manga: chunk });
    for (const [id, s] of Object.entries(res.statistics)) {
      out[id] = {
        follows: s.follows ?? null,
        rating: s.rating?.bayesian ?? s.rating?.average ?? null,
      };
    }
  }
  return out;
}
