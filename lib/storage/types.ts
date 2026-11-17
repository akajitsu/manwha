/**
 * Personal library data model. Stored client-side for now; the
 * `LibraryRepository` interface is the seam for a future database-backed
 * implementation (e.g. behind authenticated Route Handlers).
 */

export interface SavedManga {
  id: string;
  title: string;
  /** Proxied cover thumbnail path. */
  cover: string | null;
  status?: string;
  addedAt: number;
}

export interface HistoryEntry {
  mangaId: string;
  title: string;
  cover: string | null;
  chapterId: string;
  chapterLabel: string;
  chapterNumber: string | null;
  language: string;
  /** Scroll progress through the chapter, 0..1. */
  progress: number;
  /** 1-based page the reader was on. */
  page?: number;
  totalPages?: number;
  updatedAt: number;
}

export interface LibraryState {
  favorites: SavedManga[];
  /** Most recent reading position per series, newest first. */
  history: HistoryEntry[];
  /** Chapter ids the reader has opened, per series. */
  readChapters: Record<string, string[]>;
}

export interface LibraryRepository {
  getSnapshot(): LibraryState;
  subscribe(listener: () => void): () => void;
  toggleFavorite(manga: Omit<SavedManga, "addedAt">): boolean;
  removeFavorite(mangaId: string): void;
  recordProgress(entry: Omit<HistoryEntry, "updatedAt">): void;
  removeHistory(mangaId: string): void;
  clearHistory(): void;
}

export const EMPTY_LIBRARY: LibraryState = Object.freeze({
  favorites: [],
  history: [],
  readChapters: {},
}) as LibraryState;
