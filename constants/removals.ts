/**
 * Content removal list.
 *
 * MangaDex's Acceptable Usage Policy requires sites that allow reading to honor
 * content removal requests from scanlation groups. Add the MangaDex UUIDs of
 * groups, chapters or series here when such a request is received. Removed
 * content is excluded from chapter lists, blocked in the reader and refused by
 * the image proxy.
 */
export const REMOVED_GROUP_IDS: readonly string[] = [];
export const REMOVED_CHAPTER_IDS: readonly string[] = [];
export const REMOVED_MANGA_IDS: readonly string[] = [];

const groups = new Set(REMOVED_GROUP_IDS);
const chapters = new Set(REMOVED_CHAPTER_IDS);
const mangas = new Set(REMOVED_MANGA_IDS);

export function isRemovedChapter(chapter: { id: string; groups?: { id: string }[] }): boolean {
  return chapters.has(chapter.id) || Boolean(chapter.groups?.some((g) => groups.has(g.id)));
}

export function isRemovedManga(id: string): boolean {
  return mangas.has(id);
}
