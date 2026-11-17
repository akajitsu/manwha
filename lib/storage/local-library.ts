import { EMPTY_LIBRARY, type HistoryEntry, type LibraryRepository, type LibraryState, type SavedManga } from "./types";

const STORAGE_KEY = "inkmoon:library:v1";
const MAX_HISTORY = 200;
const MAX_READ_PER_SERIES = 3000;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitize(value: unknown): LibraryState {
  if (!value || typeof value !== "object") return EMPTY_LIBRARY;
  const v = value as Partial<LibraryState>;
  return {
    favorites: Array.isArray(v.favorites) ? v.favorites.filter((f) => f && typeof f.id === "string") : [],
    history: Array.isArray(v.history) ? v.history.filter((h) => h && typeof h.mangaId === "string") : [],
    readChapters: v.readChapters && typeof v.readChapters === "object" ? v.readChapters : {},
  };
}

/** localStorage-backed repository. Only touches storage in the browser. */
class LocalLibraryRepository implements LibraryRepository {
  private snapshot: LibraryState = EMPTY_LIBRARY;
  private loaded = false;
  private listeners = new Set<() => void>();

  private load() {
    if (this.loaded || !isBrowser()) return;
    this.loaded = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      this.snapshot = raw ? sanitize(JSON.parse(raw)) : EMPTY_LIBRARY;
    } catch {
      this.snapshot = EMPTY_LIBRARY;
    }
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        this.snapshot = e.newValue ? sanitize(JSON.parse(e.newValue)) : EMPTY_LIBRARY;
      } catch {
        this.snapshot = EMPTY_LIBRARY;
      }
      this.emit();
    });
  }

  private commit(next: LibraryState) {
    this.snapshot = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full or disabled (private mode). Keep the in-memory state.
    }
    this.emit();
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  getSnapshot = (): LibraryState => {
    this.load();
    return this.snapshot;
  };

  subscribe = (listener: () => void) => {
    this.load();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  toggleFavorite = (manga: Omit<SavedManga, "addedAt">): boolean => {
    const state = this.getSnapshot();
    const exists = state.favorites.some((f) => f.id === manga.id);
    const favorites = exists
      ? state.favorites.filter((f) => f.id !== manga.id)
      : [{ ...manga, addedAt: Date.now() }, ...state.favorites];
    this.commit({ ...state, favorites });
    return !exists;
  };

  removeFavorite = (mangaId: string) => {
    const state = this.getSnapshot();
    this.commit({ ...state, favorites: state.favorites.filter((f) => f.id !== mangaId) });
  };

  recordProgress = (entry: Omit<HistoryEntry, "updatedAt">) => {
    const state = this.getSnapshot();
    const full: HistoryEntry = { ...entry, progress: Math.min(1, Math.max(0, entry.progress)), updatedAt: Date.now() };
    const history = [full, ...state.history.filter((h) => h.mangaId !== entry.mangaId)].slice(0, MAX_HISTORY);
    const read = state.readChapters[entry.mangaId] ?? [];
    const readChapters = read.includes(entry.chapterId)
      ? state.readChapters
      : { ...state.readChapters, [entry.mangaId]: [...read, entry.chapterId].slice(-MAX_READ_PER_SERIES) };
    this.commit({ ...state, history, readChapters });
  };

  removeHistory = (mangaId: string) => {
    const state = this.getSnapshot();
    const readChapters = { ...state.readChapters };
    delete readChapters[mangaId];
    this.commit({ ...state, history: state.history.filter((h) => h.mangaId !== mangaId), readChapters });
  };

  clearHistory = () => {
    const state = this.getSnapshot();
    this.commit({ ...state, history: [], readChapters: {} });
  };
}

export const libraryRepository: LibraryRepository = new LocalLibraryRepository();
