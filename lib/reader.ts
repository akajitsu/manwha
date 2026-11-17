import type { ChapterNavItem } from "@/lib/mangadex";
import { chapterShortLabel } from "@/lib/utils/format";

export interface NavTarget {
  id: string;
  label: string;
}

/**
 * Finds the previous/next chapter in an ascending chapter list, skipping other
 * groups' releases of the current chapter number and preferring a release by
 * the same scanlation group when several exist for the target number.
 */
export function adjacentChapter(list: ChapterNavItem[], index: number, dir: 1 | -1): NavTarget | null {
  const current = list[index];
  if (!current) return null;
  let i = index + dir;
  while (i >= 0 && i < list.length && current.number !== null && list[i].number === current.number) i += dir;
  if (i < 0 || i >= list.length) return null;

  const targetNumber = list[i].number;
  const candidates: ChapterNavItem[] = [list[i]];
  if (targetNumber !== null) {
    for (let j = i + dir; j >= 0 && j < list.length && list[j].number === targetNumber; j += dir) candidates.push(list[j]);
  }
  const pick = candidates.find((c) => c.groupIds.some((g) => current.groupIds.includes(g))) ?? candidates[0];
  return { id: pick.id, label: chapterShortLabel(pick) };
}

/** One entry per chapter number for the chapter selector (current chapter always included). */
export function chapterOptions(list: ChapterNavItem[], currentId: string): { id: string; label: string }[] {
  const current = list.find((c) => c.id === currentId);
  const byNumber = new Map<string, ChapterNavItem>();
  const out: ChapterNavItem[] = [];
  for (const ch of list) {
    if (ch.number === null) {
      out.push(ch);
      continue;
    }
    const existing = byNumber.get(ch.number);
    if (!existing) {
      byNumber.set(ch.number, ch);
      out.push(ch);
    } else if (ch.id === currentId || (existing.id !== currentId && current && ch.groupIds.some((g) => current.groupIds.includes(g)))) {
      out[out.indexOf(existing)] = ch;
      byNumber.set(ch.number, ch);
    }
  }
  return out.map((c) => ({
    id: c.id,
    label: `${chapterShortLabel(c)}${c.title ? ` — ${c.title}` : ""}`,
  }));
}
