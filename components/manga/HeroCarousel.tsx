"use client";

import { BookOpen, ChevronLeft, ChevronRight, Info, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { comicTypeLabel } from "@/constants/site";
import { chapterShortLabel, cn, formatCompact } from "@/lib/utils/format";
import type { FeaturedItem } from "@/types/manga";

import { RatingBadge, StatusBadge } from "./badges";
import { CoverImage } from "./CoverImage";

const INTERVAL_MS = 7000;

export function HeroCarousel({ items }: { items: FeaturedItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = items.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, paused, count, go]);

  if (count === 0) return null;
  const item = items[index];
  const { manga, latest, stats } = item;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured series"
      className="relative overflow-hidden border-b border-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" aria-hidden>
        {items.map((it, i) =>
          it.manga.cover ? (
            <Image
              key={it.manga.id}
              src={it.manga.cover.medium}
              alt=""
              fill
              unoptimized
              sizes="100vw"
              loading={i === 0 ? "eager" : "lazy"}
              className={cn(
                "scale-110 object-cover object-[center_25%] blur-2xl transition-opacity duration-700",
                i === index ? "opacity-40" : "opacity-0",
              )}
            />
          ) : null,
        )}
        <div className="absolute inset-0 bg-linear-to-r from-bg via-bg/85 to-bg/40" />
        <div className="absolute inset-0 bg-linear-to-t from-bg via-transparent to-bg/30" />
      </div>

      <div className="container-page relative flex min-h-[340px] items-center gap-6 py-8 sm:min-h-[400px] sm:py-10 lg:gap-12">
        <div key={manga.id} className="min-w-0 flex-1 animate-fade-in">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Featured · new chapter out
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={manga.status} />
            <span className="rounded bg-raised px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              {comicTypeLabel(manga.originalLanguage)}
            </span>
            <RatingBadge rating={stats?.rating} />
            {stats?.follows ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted" title="MangaDex follows">
                <Users className="size-3" aria-hidden />
                {formatCompact(stats.follows)}
              </span>
            ) : null}
          </div>
          <h2 className="line-clamp-2 max-w-2xl text-2xl font-extrabold leading-tight tracking-tight text-fg sm:text-4xl">
            {manga.title}
          </h2>
          {manga.genres.length > 0 && (
            <p className="mt-2 truncate text-sm text-muted">{manga.genres.slice(0, 5).map((g) => g.name).join(" · ")}</p>
          )}
          {manga.description && (
            <p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-[15px]">
              {manga.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/read/${latest.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink transition hover:bg-accent-strong"
            >
              <BookOpen className="size-4" aria-hidden />
              Read {chapterShortLabel(latest)}
            </Link>
            <Link
              href={`/manga/${manga.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-elevated/60 px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-fg/40"
            >
              <Info className="size-4" aria-hidden />
              View details
            </Link>
          </div>
        </div>

        <Link
          href={`/manga/${manga.id}`}
          className="relative hidden aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10 transition hover:ring-accent/60 sm:block md:w-52 lg:w-60"
          aria-label={`${manga.title} details`}
          tabIndex={-1}
        >
          <CoverImage key={manga.id} src={manga.cover?.medium} alt={`${manga.title} cover`} priority sizes="240px" className="animate-fade-in" />
        </Link>
      </div>

      {count > 1 && (
        <div className="container-page relative -mt-2 flex items-center gap-3 pb-5">
          <div className="flex gap-1.5" role="tablist" aria-label="Choose featured series">
            {items.map((it, i) => (
              <button
                key={it.manga.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${it.manga.title}`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-7 bg-accent" : "w-3 bg-line-strong hover:bg-muted",
                )}
              />
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="grid size-8 place-items-center rounded-md border border-line bg-surface/70 text-muted transition hover:text-fg"
              aria-label="Previous featured series"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="grid size-8 place-items-center rounded-md border border-line bg-surface/70 text-muted transition hover:text-fg"
              aria-label="Next featured series"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div className="border-b border-line" aria-hidden>
      <div className="container-page flex min-h-[340px] items-center gap-10 py-10 sm:min-h-[400px]">
        <div className="flex-1 space-y-4">
          <div className="skeleton h-3 w-40 rounded" />
          <div className="skeleton h-9 w-3/4 max-w-xl rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="space-y-2 pt-2">
            <div className="skeleton h-3 w-full max-w-2xl rounded" />
            <div className="skeleton h-3 w-5/6 max-w-2xl rounded" />
            <div className="skeleton h-3 w-2/3 max-w-2xl rounded" />
          </div>
          <div className="flex gap-3 pt-3">
            <div className="skeleton h-10 w-36 rounded-lg" />
            <div className="skeleton h-10 w-32 rounded-lg" />
          </div>
        </div>
        <div className="skeleton hidden aspect-[2/3] w-52 rounded-xl sm:block lg:w-60" />
      </div>
    </div>
  );
}
