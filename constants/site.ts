export const SITE = {
  name: "BeanZz",
  tagline: "Read manhwa, manga and manhua — powered by MangaDex",
  description:
    "Discover and read manhwa, manga and manhua. Browse the latest English chapter releases, popular series and every genre, with a reader built for vertical scrolling.",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/comics", label: "Comics" },
  { href: "/latest", label: "Latest" },
  { href: "/popular", label: "Popular" },
  { href: "/genres", label: "Genres" },
] as const;

/** Preferred reading language for chapter feeds. */
export const DEFAULT_LANGUAGE = "en";

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  "ja-ro": "Japanese (Romanized)",
  ko: "Korean",
  "ko-ro": "Korean (Romanized)",
  zh: "Chinese",
  "zh-hk": "Chinese (Traditional)",
  "zh-ro": "Chinese (Romanized)",
  es: "Spanish",
  "es-la": "Spanish (LATAM)",
  "pt-br": "Portuguese (BR)",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  uk: "Ukrainian",
  pl: "Polish",
  tr: "Turkish",
  vi: "Vietnamese",
  id: "Indonesian",
  th: "Thai",
  ar: "Arabic",
  fa: "Persian",
  he: "Hebrew",
  hi: "Hindi",
  bn: "Bengali",
  ms: "Malay",
  tl: "Filipino",
  my: "Burmese",
  ro: "Romanian",
  hu: "Hungarian",
  cs: "Czech",
  nl: "Dutch",
  sv: "Swedish",
  el: "Greek",
  sr: "Serbian",
  lt: "Lithuanian",
  ka: "Georgian",
  kk: "Kazakh",
  ta: "Tamil",
  te: "Telugu",
  ne: "Nepali",
  mn: "Mongolian",
  ca: "Catalan",
  bg: "Bulgarian",
  da: "Danish",
  fi: "Finnish",
  no: "Norwegian",
  hr: "Croatian",
  la: "Latin",
  eo: "Esperanto",
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}

/** Comic "type" derived from the original publication language. */
export const COMIC_TYPES = [
  { value: "ko", label: "Manhwa" },
  { value: "ja", label: "Manga" },
  { value: "zh", label: "Manhua" },
] as const;

export function comicTypeLabel(originalLanguage: string): string {
  if (originalLanguage.startsWith("ko")) return "Manhwa";
  if (originalLanguage.startsWith("zh")) return "Manhua";
  if (originalLanguage.startsWith("ja")) return "Manga";
  return "Comic";
}

export const STATUS_OPTIONS = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "hiatus", label: "Hiatus" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/**
 * Catalog sort options mapped onto MangaDex `order[...]` parameters.
 * "follows" and "rating" are MangaDex community data, not a BeanZz algorithm.
 */
export const SORT_OPTIONS = [
  { value: "latest", label: "Latest update", order: { latestUploadedChapter: "desc" } },
  { value: "follows", label: "Most followed", order: { followedCount: "desc" } },
  { value: "rating", label: "Top rated", order: { rating: "desc" } },
  { value: "newest", label: "Newly added", order: { createdAt: "desc" } },
  { value: "year", label: "Release year", order: { year: "desc" } },
  { value: "title", label: "Title A–Z", order: { title: "asc" } },
  { value: "relevance", label: "Best match", order: { relevance: "desc" } },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 30;

/**
 * Genres highlighted on the genre discovery page. Names are matched against
 * MangaDex's live tag list, so anything missing upstream is simply skipped.
 */
export const FEATURED_GENRES = [
  "Action",
  "Fantasy",
  "Romance",
  "Comedy",
  "Drama",
  "Martial Arts",
  "Mystery",
  "Horror",
] as const;
