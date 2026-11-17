import { COMIC_TYPES, PAGE_SIZE, SORT_OPTIONS, STATUS_OPTIONS, type SortValue } from "@/constants/site";
import { firstParam, isUuid, listParam, pageParam } from "@/lib/utils/format";

/** Validated catalog filters parsed from the URL. */
export interface CatalogFilters {
  q: string;
  genres: string[];
  status: string[];
  types: string[];
  sort: SortValue;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const SORTS = new Set<string>(SORT_OPTIONS.map((o) => o.value));
const STATUSES = new Set<string>(STATUS_OPTIONS.map((o) => o.value));
const TYPES = new Set<string>(COMIC_TYPES.map((o) => o.value));

export function parseCatalogParams(sp: RawParams): CatalogFilters {
  const q = (firstParam(sp.q) ?? "").trim().slice(0, 100);
  const rawSort = firstParam(sp.sort);
  const sort = (rawSort && SORTS.has(rawSort) ? rawSort : q ? "relevance" : "latest") as SortValue;
  return {
    q,
    genres: [...new Set([...listParam(sp.genres), ...listParam(sp.genre)])].filter(isUuid).slice(0, 10),
    status: listParam(sp.status).filter((s) => STATUSES.has(s)),
    types: listParam(sp.type).filter((t) => TYPES.has(t)),
    sort,
    page: pageParam(sp.page),
  };
}

export function catalogHref(filters: Partial<CatalogFilters>, base = "/comics"): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.genres?.length) sp.set("genres", filters.genres.join(","));
  if (filters.status?.length) sp.set("status", filters.status.join(","));
  if (filters.types?.length) sp.set("type", filters.types.join(","));
  if (filters.sort && filters.sort !== (filters.q ? "relevance" : "latest")) sp.set("sort", filters.sort);
  if (filters.page && filters.page > 1) sp.set("page", String(filters.page));
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function maxPages(total: number): number {
  return Math.max(1, Math.ceil(Math.min(total, 10_000) / PAGE_SIZE));
}

/** Map original-language "types" to MangaDex originalLanguage values. */
export function typesToLanguages(types: string[]): string[] {
  return types.flatMap((t) => (t === "zh" ? ["zh", "zh-hk"] : [t]));
}
