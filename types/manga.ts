/**
 * Application view models. UI components only consume these types, never the
 * raw MangaDex shapes, so the data source can be swapped later.
 */
import type { ContentRating, Demographic, PublicationStatus } from "./mangadex";

export interface Tag {
  id: string;
  name: string;
  group: "genre" | "theme" | "format" | "content";
}

export interface Cover {
  /** Proxied 256px thumbnail. */
  thumb: string;
  /** Proxied 512px thumbnail. */
  medium: string;
  /** Proxied original resolution image. */
  full: string;
}

export interface Person {
  id: string;
  name: string;
}

export interface MangaSummary {
  id: string;
  title: string;
  cover: Cover | null;
  status: PublicationStatus;
  contentRating: ContentRating;
  originalLanguage: string;
  year: number | null;
  genres: Tag[];
  description: string;
  latestUploadedChapterId: string | null;
  availableLanguages: string[];
}

export interface MangaDetail extends MangaSummary {
  altTitles: string[];
  tags: Tag[];
  authors: Person[];
  artists: Person[];
  demographic: Demographic | null;
  lastChapter: string | null;
  lastVolume: string | null;
  links: { label: string; url: string }[];
  /** Raw description (markdown-lite), unlike `description` which is plain text. */
  descriptionMarkdown: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanlationGroup {
  id: string;
  name: string;
  website: string | null;
  official: boolean;
}

export interface Chapter {
  id: string;
  mangaId: string | null;
  number: string | null;
  volume: string | null;
  title: string | null;
  language: string;
  pages: number;
  externalUrl: string | null;
  publishedAt: string;
  groups: ScanlationGroup[];
}

export interface MangaStats {
  follows: number | null;
  rating: number | null;
}

export interface FeaturedItem {
  manga: MangaSummary;
  latest: Chapter;
  stats: MangaStats | null;
}

export interface RecentUpdate {
  manga: MangaSummary;
  chapters: Chapter[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type ImageQuality = "data" | "data-saver";

export interface ChapterPages {
  chapterId: string;
  /** Number of pages available for each quality. */
  counts: Record<ImageQuality, number>;
}
