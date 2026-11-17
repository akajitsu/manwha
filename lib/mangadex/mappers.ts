import type {
  Chapter,
  Cover,
  MangaDetail,
  MangaSummary,
  Person,
  ScanlationGroup,
  Tag,
} from "@/types/manga";
import type {
  LocalizedString,
  MdAuthorAttributes,
  MdChapter,
  MdCoverAttributes,
  MdGroupAttributes,
  MdManga,
  MdMangaAttributes,
  MdTag,
} from "@/types/mangadex";

const COVER_FILE_RE = /^[0-9a-f-]{36}\.(?:jpe?g|png|gif|webp)$/i;

/** Builds proxied cover URLs. The browser never talks to MangaDex directly. */
export function coverUrls(mangaId: string, fileName: string | undefined | null): Cover | null {
  if (!fileName || !COVER_FILE_RE.test(fileName)) return null;
  const base = `/api/cover/${mangaId}/${encodeURIComponent(fileName)}`;
  return { thumb: `${base}?size=256`, medium: `${base}?size=512`, full: base };
}

/** Picks the best display string from a MangaDex localized-string map. */
export function pickLocalized(map: LocalizedString | undefined | null, preferred = "en"): string {
  if (!map) return "";
  return map[preferred] ?? map["en"] ?? map["ja-ro"] ?? map["ko-ro"] ?? Object.values(map)[0] ?? "";
}

/**
 * MangaDex's primary title is frequently romanized (e.g. "Na Honjaman Level-Up").
 * Prefer an explicit English title, then the first English alt title.
 */
export function pickTitle(attrs: Pick<MdMangaAttributes, "title" | "altTitles">): string {
  if (attrs.title.en) return attrs.title.en;
  const altEn = attrs.altTitles?.find((t) => t.en)?.en;
  if (altEn) return altEn;
  return pickLocalized(attrs.title) || "Untitled";
}

function collectAltTitles(attrs: MdMangaAttributes, primary: string): string[] {
  const preferredLangs = new Set(["en", "ja-ro", "ko-ro", "zh-ro", "ja", "ko", "zh", "zh-hk"]);
  const out: string[] = [];
  const seen = new Set([primary.toLowerCase()]);
  const add = (value: string | undefined) => {
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(value);
  };
  for (const v of Object.values(attrs.title)) add(v);
  for (const t of attrs.altTitles ?? []) {
    for (const [lang, v] of Object.entries(t)) if (preferredLangs.has(lang)) add(v);
  }
  return out.slice(0, 8);
}

/**
 * MangaDex descriptions are markdown and frequently end with a "---" block of
 * external links. Keep only the synopsis.
 */
export function cleanDescriptionMarkdown(raw: string): string {
  return raw
    .split(/\n\s*(?:---+|___+|\*\*\*+)\s*\n/)[0]
    .replace(/\r/g, "")
    .trim();
}

/** Plain-text version suited for cards and meta descriptions. */
export function markdownToPlain(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`>#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapTag(tag: MdTag): Tag {
  return { id: tag.id, name: pickLocalized(tag.attributes.name), group: tag.attributes.group };
}

const LINK_LABELS: Record<string, { label: string; url: (v: string) => string }> = {
  al: { label: "AniList", url: (v) => `https://anilist.co/manga/${v}` },
  mal: { label: "MyAnimeList", url: (v) => `https://myanimelist.net/manga/${v}` },
  mu: { label: "MangaUpdates", url: (v) => `https://www.mangaupdates.com/series/${v}` },
  kt: { label: "Kitsu", url: (v) => `https://kitsu.app/manga/${v}` },
  raw: { label: "Official raw", url: (v) => v },
  engtl: { label: "Official English", url: (v) => v },
};

function mapLinks(links: Record<string, string> | null): { label: string; url: string }[] {
  if (!links) return [];
  const out: { label: string; url: string }[] = [];
  for (const [key, value] of Object.entries(links)) {
    const def = LINK_LABELS[key];
    if (!def || !value) continue;
    const url = def.url(value);
    if (/^https?:\/\//i.test(url)) out.push({ label: def.label, url });
  }
  return out;
}

export function mapMangaSummary(manga: MdManga): MangaSummary {
  const a = manga.attributes;
  const coverRel = manga.relationships.find((r) => r.type === "cover_art");
  const coverAttrs = coverRel?.attributes as MdCoverAttributes | undefined;
  const tags = a.tags.map(mapTag);
  return {
    id: manga.id,
    title: pickTitle(a),
    cover: coverUrls(manga.id, coverAttrs?.fileName),
    status: a.status,
    contentRating: a.contentRating,
    originalLanguage: a.originalLanguage,
    year: a.year,
    genres: tags.filter((t) => t.group === "genre"),
    description: markdownToPlain(cleanDescriptionMarkdown(pickLocalized(a.description))).slice(0, 400),
    latestUploadedChapterId: a.latestUploadedChapter,
    availableLanguages: a.availableTranslatedLanguages.filter((l): l is string => Boolean(l)),
  };
}

function mapPeople(manga: MdManga, type: "author" | "artist"): Person[] {
  return manga.relationships
    .filter((r) => r.type === type)
    .map((r) => ({ id: r.id, name: (r.attributes as MdAuthorAttributes | undefined)?.name ?? "Unknown" }));
}

export function mapMangaDetail(manga: MdManga): MangaDetail {
  const summary = mapMangaSummary(manga);
  const a = manga.attributes;
  const descriptionMarkdown = cleanDescriptionMarkdown(pickLocalized(a.description));
  return {
    ...summary,
    description: markdownToPlain(descriptionMarkdown),
    descriptionMarkdown,
    altTitles: collectAltTitles(a, summary.title),
    tags: a.tags.map(mapTag),
    authors: mapPeople(manga, "author"),
    artists: mapPeople(manga, "artist"),
    demographic: a.publicationDemographic,
    lastChapter: a.lastChapter || null,
    lastVolume: a.lastVolume || null,
    links: mapLinks(a.links),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export function mapChapter(chapter: MdChapter): Chapter {
  const a = chapter.attributes;
  const groups: ScanlationGroup[] = chapter.relationships
    .filter((r) => r.type === "scanlation_group")
    .map((r) => {
      const g = r.attributes as MdGroupAttributes | undefined;
      return {
        id: r.id,
        name: g?.name ?? "Unknown group",
        website: g?.website ?? null,
        official: Boolean(g?.official),
      };
    });
  const mangaRel = chapter.relationships.find((r) => r.type === "manga");
  return {
    id: chapter.id,
    mangaId: mangaRel?.id ?? null,
    number: a.chapter,
    volume: a.volume,
    title: a.title?.trim() || null,
    language: a.translatedLanguage,
    pages: a.pages,
    externalUrl: a.externalUrl,
    publishedAt: a.readableAt ?? a.publishAt,
    groups,
  };
}
