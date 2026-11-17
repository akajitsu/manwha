"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, ExternalLink, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { TimeAgo } from "@/components/ui/TimeAgo";
import { languageName } from "@/constants/site";
import { useLibrary } from "@/hooks/useLibrary";
import { chapterLabel, cn } from "@/lib/utils/format";
import type { Chapter, Paginated } from "@/types/manga";

type Order = "asc" | "desc";

const PAGE = 100;

/**
 * Chapter list with incremental loading, sort order, language switching and
 * read markers. Official chapters hosted elsewhere link out to the publisher.
 */
export function ChapterList({
  mangaId,
  initial,
  initialLanguage,
  languages,
}: {
  mangaId: string;
  initial: Paginated<Chapter>;
  initialLanguage: string;
  languages: string[];
}) {
  const { readChapters } = useLibrary();
  const read = useMemo(() => new Set(readChapters[mangaId] ?? []), [readChapters, mangaId]);

  const [chapters, setChapters] = useState(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [order, setOrder] = useState<Order>("desc");
  const [language, setLanguage] = useState(initialLanguage);
  const [loading, setLoading] = useState<"more" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const requestId = useRef(0);

  async function load(opts: { order: Order; language: string; offset: number }) {
    const id = ++requestId.current;
    setLoading(opts.offset === 0 ? "reset" : "more");
    setError(null);
    try {
      const sp = new URLSearchParams({
        lang: opts.language,
        order: opts.order,
        offset: String(opts.offset),
        limit: String(PAGE),
      });
      const res = await fetch(`/api/manga/${mangaId}/chapters?${sp}`);
      if (!res.ok) throw new Error(res.status === 429 ? "MangaDex is rate limiting requests. Try again in a moment." : "Couldn't load chapters.");
      const data = (await res.json()) as Paginated<Chapter>;
      if (id !== requestId.current) return; // a newer request superseded this one
      setChapters((prev) => (opts.offset === 0 ? data.items : [...prev, ...data.items]));
      setTotal(data.total);
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : "Couldn't load chapters.");
    } finally {
      if (id === requestId.current) setLoading(null);
    }
  }

  function changeOrder(next: Order) {
    if (next === order) return;
    setOrder(next);
    void load({ order: next, language, offset: 0 });
  }

  function changeLanguage(next: string) {
    setLanguage(next);
    void load({ order, language: next, offset: 0 });
  }

  const visible = filter.trim()
    ? chapters.filter((c) => (c.number ?? "").startsWith(filter.trim()) || c.title?.toLowerCase().includes(filter.trim().toLowerCase()))
    : chapters;

  return (
    <section aria-labelledby="chapters-heading" className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 sm:p-4">
        <h2 id="chapters-heading" className="mr-auto text-lg font-bold">
          Chapters <span className="text-sm font-medium text-subtle">({total.toLocaleString("en")})</span>
        </h2>
        <div className="relative w-full sm:w-40">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            inputMode="search"
            placeholder="Find chapter…"
            aria-label="Find a loaded chapter by number or title"
            className="h-9 w-full rounded-lg border border-line bg-bg pl-8 pr-2 text-sm placeholder:text-subtle focus:border-accent/70 focus:outline-none"
          />
        </div>
        {languages.length > 1 && (
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            aria-label="Chapter language"
            className="h-9 rounded-lg border border-line bg-bg px-2 text-sm text-fg focus:border-accent/70 focus:outline-none"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {languageName(l)}
              </option>
            ))}
          </select>
        )}
        <div className="flex rounded-lg border border-line bg-bg p-0.5" role="group" aria-label="Sort order">
          <button
            type="button"
            onClick={() => changeOrder("desc")}
            aria-pressed={order === "desc"}
            className={cn("rounded-md p-1.5 transition", order === "desc" ? "bg-raised text-fg" : "text-subtle hover:text-fg")}
            title="Newest first"
          >
            <ArrowDownWideNarrow className="size-4" />
            <span className="sr-only">Newest first</span>
          </button>
          <button
            type="button"
            onClick={() => changeOrder("asc")}
            aria-pressed={order === "asc"}
            className={cn("rounded-md p-1.5 transition", order === "asc" ? "bg-raised text-fg" : "text-subtle hover:text-fg")}
            title="Oldest first"
          >
            <ArrowUpNarrowWide className="size-4" />
            <span className="sr-only">Oldest first</span>
          </button>
        </div>
      </div>

      <div className={cn("transition-opacity", loading === "reset" && "pointer-events-none opacity-50")}>
        {visible.length === 0 && !loading ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            {filter ? "No loaded chapters match that filter." : `No ${languageName(language)} chapters are available on MangaDex.`}
          </p>
        ) : (
          <ul className="max-h-[720px] divide-y divide-line overflow-y-auto">
            {visible.map((ch) => {
              const isRead = read.has(ch.id);
              const groups = ch.groups.length ? ch.groups.map((g) => g.name).join(", ") : "No group";
              const inner = (
                <>
                  <div className="min-w-0 flex-1">
                    <p className={cn("flex items-center gap-1.5 truncate text-sm font-medium", isRead ? "text-subtle" : "text-fg")}>
                      {isRead && <Check className="size-3.5 shrink-0 text-success" aria-label="Read" />}
                      <span className="truncate">
                        {chapterLabel(ch)}
                        {ch.title && ch.number ? <span className="font-normal text-muted"> — {ch.title}</span> : null}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-subtle">
                      {ch.externalUrl ? (
                        <span className="mr-1.5 rounded bg-info/15 px-1 py-px text-[10px] font-semibold uppercase text-info">Official</span>
                      ) : null}
                      {groups}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-subtle">
                    <TimeAgo date={ch.publishedAt} />
                    {ch.externalUrl && <ExternalLink className="size-3.5" aria-label="Opens the official site" />}
                  </div>
                </>
              );
              const rowClass = "flex items-center gap-3 px-3 py-2.5 transition hover:bg-elevated sm:px-4";
              return (
                <li key={ch.id}>
                  {ch.externalUrl ? (
                    <a href={ch.externalUrl} target="_blank" rel="noopener noreferrer" className={rowClass}>
                      {inner}
                    </a>
                  ) : (
                    <Link href={`/read/${ch.id}`} className={rowClass}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="border-t border-line px-4 py-3 text-center text-sm text-danger">
          {error}
        </p>
      )}
      {chapters.length < total && !filter && (
        <div className="border-t border-line p-3 text-center">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => load({ order, language, offset: chapters.length })}
            className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-fg transition hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {loading === "more" && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Load more ({(total - chapters.length).toLocaleString("en")} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
