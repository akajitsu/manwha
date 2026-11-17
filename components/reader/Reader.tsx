"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Settings2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { useHydrated } from "@/hooks/useLibrary";
import { setReaderPrefs, useReaderPrefs, type ReaderWidth } from "@/hooks/useReaderPrefs";
import { libraryRepository } from "@/lib/storage/local-library";
import { cn } from "@/lib/utils/format";
import type { ImageQuality, ScanlationGroup } from "@/types/manga";

import { ReaderPage } from "./ReaderPage";

export interface ReaderProps {
  chapter: {
    id: string;
    label: string;
    shortLabel: string;
    title: string | null;
    number: string | null;
    language: string;
    groups: ScanlationGroup[];
  };
  manga: { id: string; title: string; cover: string | null };
  pageCounts: Record<ImageQuality, number>;
  prev: { id: string; label: string } | null;
  next: { id: string; label: string } | null;
  options: { id: string; label: string }[];
}

const WIDTH_CLASSES: Record<ReaderWidth, string> = {
  fit: "max-w-[760px]",
  wide: "max-w-[1080px]",
  full: "max-w-none",
};

function GroupCredits({ groups }: { groups: ScanlationGroup[] }) {
  if (groups.length === 0) return <span>No scanlation group credited</span>;
  return (
    <span>
      Translated by{" "}
      {groups.map((g, i) => (
        <span key={g.id}>
          {i > 0 && ", "}
          <a
            href={`https://mangadex.org/group/${g.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-fg hover:text-accent"
          >
            {g.name}
          </a>
        </span>
      ))}
    </span>
  );
}

function ChapterSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select chapter"
      className={cn(
        "h-9 min-w-0 rounded-lg border border-line bg-surface px-2 text-sm text-fg focus:border-accent/70 focus:outline-none",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Reader({ chapter, manga, pageCounts, prev, next, options }: ReaderProps) {
  const router = useRouter();
  const toast = useToast();
  const hydrated = useHydrated();
  const prefs = useReaderPrefs();
  const total = pageCounts[prefs.quality] || pageCounts.data || pageCounts["data-saver"];

  const [barsVisible, setBarsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resumePage, setResumePage] = useState<number | null>(null);
  const lastScrollY = useRef(0);
  const pageRef = useRef(1);
  const progressRef = useRef(0);

  // ---- Persist reading progress -------------------------------------------
  const save = useCallback(() => {
    if (!manga.id) return;
    libraryRepository.recordProgress({
      mangaId: manga.id,
      title: manga.title,
      cover: manga.cover,
      chapterId: chapter.id,
      chapterLabel: chapter.shortLabel,
      chapterNumber: chapter.number,
      language: chapter.language,
      progress: progressRef.current,
      page: pageRef.current,
      totalPages: total,
    });
  }, [manga, chapter, total]);

  // Offer to resume if this chapter was left part-way through.
  useEffect(() => {
    const entry = libraryRepository.getSnapshot().history.find((h) => h.mangaId === manga.id);
    const resumable = entry && entry.chapterId === chapter.id && entry.page && entry.page > 2 && entry.progress < 0.97;
    save();
    if (resumable) {
      const id = window.setTimeout(() => setResumePage(entry.page ?? null), 0);
      return () => window.clearTimeout(id);
    }
  }, [manga.id, chapter.id, save]);

  // ---- Scroll tracking: progress bar, auto-hiding bars, periodic save ------
  useEffect(() => {
    let frame = 0;
    let saveTimer: number | undefined;
    // Throttled (at most every 2s while scrolling) plus a trailing save once
    // scrolling stops, so long continuous scrolls are still recorded.
    let lastSave = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        progressRef.current = p;
        setProgress(p);
        if (y > lastScrollY.current + 12 && y > 120) {
          setBarsVisible(false);
          setSettingsOpen(false);
        } else if (y < lastScrollY.current - 12 || p > 0.985) {
          setBarsVisible(true);
        }
        lastScrollY.current = y;
        const now = performance.now();
        if (now - lastSave > 2000) {
          lastSave = now;
          save();
        }
      });
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        lastSave = performance.now();
        save();
      }, 800);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onHide = () => save();
    window.addEventListener("pagehide", onHide);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(saveTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onHide);
      save();
    };
  }, [save]);

  // ---- Current page indicator ---------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const n = Number((e.target as HTMLElement).dataset.page);
            if (n) {
              pageRef.current = n;
              setCurrentPage(n);
            }
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-page]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [hydrated, total, prefs.quality]);

  // ---- Fullscreen -----------------------------------------------------------
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenEnabled) {
      toast.show("Fullscreen isn't supported on this device.", "info");
      return;
    }
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => toast.show("Couldn't enter fullscreen.", "error"));
  }, [toast]);

  // ---- Keyboard shortcuts ---------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, select, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" && next) router.push(`/read/${next.id}`);
      else if (e.key === "ArrowLeft" && prev) router.push(`/read/${prev.id}`);
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router, toggleFullscreen]);

  function changeQuality(quality: ImageQuality) {
    const keep = pageRef.current;
    setReaderPrefs({ quality });
    requestAnimationFrame(() => document.getElementById(`page-${keep}`)?.scrollIntoView());
  }

  function goToChapter(id: string) {
    if (id !== chapter.id) router.push(`/read/${id}`);
  }

  const navBtn =
    "inline-flex h-9 items-center gap-1 rounded-lg border border-line px-2.5 text-sm font-medium text-muted transition hover:border-line-strong hover:text-fg";
  const navBtnDisabled = "inline-flex h-9 items-center gap-1 rounded-lg border border-line/50 px-2.5 text-sm text-subtle/50";

  return (
    <div className="min-h-screen bg-bg">
      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent" aria-hidden>
        <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Top bar */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md transition-transform duration-300",
          !barsVisible && "-translate-y-full",
        )}
      >
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-2 px-3 sm:px-4">
          <Link
            href={`/manga/${manga.id}`}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-fg"
            aria-label={`Back to ${manga.title}`}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/manga/${manga.id}`} className="block truncate text-sm font-semibold text-fg hover:text-accent">
              {manga.title}
            </Link>
            <p className="truncate text-xs text-subtle">
              {chapter.label}
              {chapter.title && chapter.number ? ` — ${chapter.title}` : ""}
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {prev ? (
              <Link href={`/read/${prev.id}`} className={navBtn} aria-label={`Previous: ${prev.label}`}>
                <ChevronLeft className="size-4" /> Prev
              </Link>
            ) : (
              <span className={navBtnDisabled} aria-hidden>
                <ChevronLeft className="size-4" /> Prev
              </span>
            )}
            <ChapterSelect value={chapter.id} options={options} onChange={goToChapter} className="max-w-[220px]" />
            {next ? (
              <Link href={`/read/${next.id}`} className={navBtn} aria-label={`Next: ${next.label}`}>
                Next <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span className={navBtnDisabled} aria-hidden>
                Next <ChevronRight className="size-4" />
              </span>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              aria-expanded={settingsOpen}
              className={cn(
                "grid size-9 place-items-center rounded-lg transition hover:bg-elevated",
                settingsOpen ? "bg-elevated text-accent" : "text-muted hover:text-fg",
              )}
              aria-label="Reader settings"
            >
              <Settings2 className="size-5" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 animate-fade-in rounded-xl border border-line-strong bg-elevated p-3 shadow-2xl shadow-black/60">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">Image quality</p>
                <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-bg p-1">
                  {(
                    [
                      ["data", "Original"],
                      ["data-saver", "Data saver"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={prefs.quality === value}
                      onClick={() => changeQuality(value)}
                      className={cn(
                        "rounded-md py-1.5 text-xs font-semibold transition",
                        prefs.quality === value ? "bg-accent text-accent-ink" : "text-muted hover:text-fg",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">Page width</p>
                <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-bg p-1">
                  {(
                    [
                      ["fit", "Fit"],
                      ["wide", "Wide"],
                      ["full", "Full"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={prefs.width === value}
                      onClick={() => setReaderPrefs({ width: value })}
                      className={cn(
                        "rounded-md py-1.5 text-xs font-semibold transition",
                        prefs.width === value ? "bg-accent text-accent-ink" : "text-muted hover:text-fg",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2 text-xs font-semibold text-fg transition hover:border-accent hover:text-accent"
                >
                  {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
                  {isFullscreen ? "Exit fullscreen" : "Fullscreen"} <kbd className="text-subtle">F</kbd>
                </button>
                <p className="mt-3 text-[11px] leading-relaxed text-subtle">Tip: use ← → to change chapters.</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Pages */}
      <main className="pt-14">
        <div className="mx-auto max-w-[760px] px-4 py-4 text-center text-xs text-subtle">
          <p className="flex items-center justify-center gap-1.5">
            <Users className="size-3.5" aria-hidden />
            <GroupCredits groups={chapter.groups} />
          </p>
        </div>

        {resumePage && (
          <div className="sticky top-16 z-30 mx-auto mb-3 flex w-fit items-center gap-3 rounded-full border border-line-strong bg-elevated/95 py-1.5 pl-4 pr-1.5 text-sm shadow-xl backdrop-blur animate-fade-in">
            <span className="text-muted">You stopped at page {resumePage}</span>
            <button
              type="button"
              onClick={() => {
                document.getElementById(`page-${resumePage}`)?.scrollIntoView({ behavior: "smooth" });
                setResumePage(null);
              }}
              className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink"
            >
              Resume
            </button>
            <button type="button" onClick={() => setResumePage(null)} className="px-1 text-xs text-subtle hover:text-fg">
              Dismiss
            </button>
          </div>
        )}

        <div
          className={cn("mx-auto flex flex-col", WIDTH_CLASSES[prefs.width])}
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName === "IMG") setBarsVisible((v) => !v);
          }}
        >
          {hydrated
            ? Array.from({ length: total }, (_, i) => (
                <ReaderPage
                  key={`${prefs.quality}-${i}`}
                  src={`/api/chapter-image/${chapter.id}/${prefs.quality}/${i}`}
                  pageNumber={i + 1}
                  total={total}
                  eager={i < 3}
                />
              ))
            : Array.from({ length: Math.min(total, 2) }, (_, i) => (
                <div key={i} className="skeleton min-h-[70vh] w-full" aria-hidden />
              ))}
        </div>

        {/* End of chapter */}
        <section className="mx-auto max-w-[760px] px-4 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">End of {chapter.shortLabel}</p>
          <h2 className="mt-2 text-xl font-bold">{manga.title}</h2>
          <p className="mt-2 text-xs text-subtle">
            <GroupCredits groups={chapter.groups} /> · hosted on{" "}
            <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              MangaDex
            </a>
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {next ? (
              <Link
                href={`/read/${next.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-accent-ink transition hover:bg-accent-strong sm:w-auto"
              >
                Next: {next.label} <ChevronRight className="size-4" />
              </Link>
            ) : (
              <p className="rounded-lg border border-line px-4 py-3 text-sm text-muted">
                You&apos;re all caught up — this is the latest available chapter.
              </p>
            )}
            {prev && (
              <Link
                href={`/read/${prev.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong px-6 py-3 text-sm font-semibold text-fg transition hover:border-fg/40 sm:w-auto"
              >
                <ChevronLeft className="size-4" /> Previous
              </Link>
            )}
            <Link
              href={`/manga/${manga.id}`}
              className="inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-muted transition hover:text-fg sm:w-auto"
            >
              Back to series
            </Link>
          </div>
        </section>
      </main>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Chapter navigation"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-300 md:hidden",
          !barsVisible && "translate-y-full",
        )}
      >
        <div className="flex h-14 items-center gap-2 px-3">
          {prev ? (
            <Link href={`/read/${prev.id}`} className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-fg" aria-label={`Previous: ${prev.label}`}>
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line/50 text-subtle/50" aria-hidden>
              <ChevronLeft className="size-5" />
            </span>
          )}
          <ChapterSelect value={chapter.id} options={options} onChange={goToChapter} className="h-10 flex-1" />
          {next ? (
            <Link href={`/read/${next.id}`} className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink" aria-label={`Next: ${next.label}`}>
              <ChevronRight className="size-5" />
            </Link>
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line/50 text-subtle/50" aria-hidden>
              <ChevronRight className="size-5" />
            </span>
          )}
        </div>
      </nav>

      {/* Page indicator */}
      {hydrated && total > 0 && (
        <div
          className={cn(
            "pointer-events-none fixed bottom-4 right-4 z-30 hidden rounded-full border border-line bg-elevated/90 px-3 py-1 text-xs tabular-nums text-muted backdrop-blur transition-opacity md:block",
            !barsVisible && "opacity-40",
          )}
          aria-live="off"
        >
          {currentPage} / {total}
        </div>
      )}
    </div>
  );
}
