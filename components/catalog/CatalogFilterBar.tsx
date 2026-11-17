"use client";

import { Check, ChevronDown, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { COMIC_TYPES, SORT_OPTIONS, STATUS_OPTIONS, type SortValue } from "@/constants/site";
import { catalogHref, type CatalogFilters } from "@/lib/catalog";
import { cn } from "@/lib/utils/format";
import type { Tag } from "@/types/manga";

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-3 pr-8 text-sm text-fg transition hover:border-line-strong focus:border-accent/70 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-elevated">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </label>
  );
}

/**
 * Catalog controls. All state lives in the URL, so every filtered view is
 * shareable and works with back/forward navigation.
 */
export function CatalogFilterBar({
  filters,
  genres,
  basePath = "/comics",
}: {
  filters: CatalogFilters;
  genres: Tag[];
  basePath?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const [genresOpen, setGenresOpen] = useState(filters.genres.length > 0);

  // Keep the input in sync when the URL's query changes from elsewhere
  // (e.g. the header search), without clobbering what the user is typing.
  const [syncedQ, setSyncedQ] = useState(filters.q);
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    if (query.trim() !== filters.q) setQuery(filters.q);
  }
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  function navigate(next: Partial<CatalogFilters>) {
    const merged: CatalogFilters = { ...filters, ...next, page: next.page ?? 1 };
    // Switching between search/browse changes the sensible default sort.
    if ("q" in next && !("sort" in next)) {
      if (merged.q && filters.sort === "latest") merged.sort = "relevance";
      if (!merged.q && filters.sort === "relevance") merged.sort = "latest";
    }
    startTransition(() => router.push(catalogHref(merged, basePath), { scroll: false }));
  }

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => navigate({ q: value.trim() }), 450);
  }

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  const sortOptions = SORT_OPTIONS.filter((o) => o.value !== "relevance" || filters.q);
  const genreById = new Map(genres.map((g) => [g.id, g]));
  const activeCount = filters.genres.length + filters.status.length + filters.types.length + (filters.q ? 1 : 0);

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,150px))_auto]">
        <div className="relative col-span-2 sm:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (debounce.current) clearTimeout(debounce.current);
                navigate({ q: query.trim() });
              }
            }}
            placeholder="Filter by title…"
            aria-label="Filter by title"
            className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-9 text-sm text-fg placeholder:text-subtle transition focus:border-accent/70 focus:outline-none"
          />
          {pending && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-accent" aria-label="Loading" />
          )}
        </div>
        <Select
          label="Sort by"
          value={filters.sort}
          options={sortOptions}
          onChange={(v) => navigate({ sort: v as SortValue })}
        />
        <Select
          label="Status"
          value={filters.status[0] ?? ""}
          options={[{ value: "", label: "Any status" }, ...STATUS_OPTIONS]}
          onChange={(v) => navigate({ status: v ? [v] : [] })}
        />
        <Select
          label="Type"
          value={filters.types[0] ?? ""}
          options={[{ value: "", label: "All types" }, ...COMIC_TYPES]}
          onChange={(v) => navigate({ types: v ? [v] : [] })}
        />
        <button
          type="button"
          onClick={() => setGenresOpen((o) => !o)}
          aria-expanded={genresOpen}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
            genresOpen || filters.genres.length
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
          )}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Genres
          {filters.genres.length > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-ink">
              {filters.genres.length}
            </span>
          )}
        </button>
      </div>

      {genresOpen && (
        <div className="animate-fade-in rounded-xl border border-line bg-surface p-3">
          <p className="mb-2 text-xs text-subtle">Select one or more genres — results must match all of them.</p>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => {
              const on = filters.genres.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => navigate({ genres: toggle(filters.genres, g.id) })}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition",
                    on
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line bg-elevated text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  {on && <Check className="size-3" aria-hidden />}
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 text-subtle">Active:</span>
          {filters.q && (
            <Chip onRemove={() => { setQuery(""); navigate({ q: "" }); }}>“{filters.q}”</Chip>
          )}
          {filters.genres.map((id) => (
            <Chip key={id} onRemove={() => navigate({ genres: filters.genres.filter((g) => g !== id) })}>
              {genreById.get(id)?.name ?? "Genre"}
            </Chip>
          ))}
          {filters.status.map((s) => (
            <Chip key={s} onRemove={() => navigate({ status: [] })}>
              {STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s}
            </Chip>
          ))}
          {filters.types.map((t) => (
            <Chip key={t} onRemove={() => navigate({ types: [] })}>
              {COMIC_TYPES.find((o) => o.value === t)?.label ?? t}
            </Chip>
          ))}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              navigate({ q: "", genres: [], status: [], types: [], sort: "latest" });
            }}
            className="ml-1 font-semibold text-subtle underline-offset-2 transition hover:text-accent hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-raised py-0.5 pl-2 pr-1 text-fg">
      {children}
      <button type="button" onClick={onRemove} className="rounded p-0.5 text-subtle hover:text-fg" aria-label="Remove filter">
        <X className="size-3" />
      </button>
    </span>
  );
}
