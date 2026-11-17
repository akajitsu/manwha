"use client";

import { Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { comicTypeLabel } from "@/constants/site";
import { cn, statusLabel } from "@/lib/utils/format";

interface QuickResult {
  id: string;
  title: string;
  cover: string | null;
  status: string;
  year: number | null;
  originalLanguage: string;
}

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; items: QuickResult[]; total: number }
  | { kind: "error" };

const DEBOUNCE_MS = 300;

/**
 * Instant title search. Debounced, cancels stale requests, and is fully
 * keyboard navigable. Enter (without a highlighted result) opens /search.
 */
export function SearchBox({
  autoFocus = false,
  onNavigate,
  className,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      if (timer.current) clearTimeout(timer.current);
      controller.current?.abort();
    };
  }, []);

  function runSearch(q: string) {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { items: QuickResult[]; total: number };
        setState({ kind: "done", items: data.items, total: data.total });
        setActive(-1);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ kind: "error" });
      });
  }

  function onChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) {
      controller.current?.abort();
      setState({ kind: "idle" });
      return;
    }
    setState({ kind: "loading" });
    timer.current = setTimeout(() => runSearch(q), DEBOUNCE_MS);
  }

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function submit() {
    const q = query.trim();
    if (!q) return;
    go(`/search?q=${encodeURIComponent(q)}`);
  }

  const items = state.kind === "done" ? state.items : [];

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) go(`/manga/${items[active].id}`);
      else submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={root} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search titles…"
          aria-label="Search manga, manhwa and manhua"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-9 text-sm text-fg placeholder:text-subtle transition focus:border-accent/70 focus:bg-elevated focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {state.kind === "loading" ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-subtle" aria-hidden />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-subtle hover:text-fg"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line-strong bg-elevated p-1.5 shadow-2xl shadow-black/60 animate-fade-in"
        >
          {state.kind === "loading" && (
            <div className="space-y-1.5 p-1">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex gap-3 p-1.5">
                  <div className="skeleton h-14 w-10 rounded" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-2.5 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {state.kind === "error" && (
            <p className="px-3 py-4 text-center text-sm text-muted">Search is temporarily unavailable.</p>
          )}
          {state.kind === "done" && items.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted">
              No titles match <span className="text-fg">“{query.trim()}”</span>
            </p>
          )}
          {items.map((item, i) => (
            <button
              key={item.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(`/manga/${item.id}`)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition",
                i === active ? "bg-raised" : "hover:bg-raised",
              )}
            >
              <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-raised">
                {item.cover && <Image src={item.cover} alt="" fill unoptimized sizes="40px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-sm font-medium text-fg">{item.title}</span>
                <span className="mt-0.5 block text-xs text-subtle">
                  {comicTypeLabel(item.originalLanguage)}
                  {item.year ? ` · ${item.year}` : ""} · {statusLabel(item.status)}
                </span>
              </span>
            </button>
          ))}
          {state.kind === "done" && state.total > items.length && (
            <button
              type="button"
              onClick={submit}
              className="mt-1 w-full rounded-lg border-t border-line px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-accent hover:bg-raised"
            >
              See all {state.total.toLocaleString("en")} results
            </button>
          )}
        </div>
      )}
    </div>
  );
}
