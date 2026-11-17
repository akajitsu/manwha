"use client";

import { BookMarked, BookOpen, History, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { CoverImage } from "@/components/manga/CoverImage";
import { MangaGridSkeleton } from "@/components/manga/MangaCard";
import { EmptyState } from "@/components/ui/states";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { useToast } from "@/components/ui/Toast";
import { useHydrated, useLibrary } from "@/hooks/useLibrary";
import { cn, statusLabel } from "@/lib/utils/format";

type Tab = "saved" | "history";

export function LibraryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "history" ? "history" : "saved";
  const hydrated = useHydrated();
  const { favorites, history, actions } = useLibrary();
  const toast = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  const progressById = new Map(history.map((h) => [h.mangaId, h]));

  function setTab(next: Tab) {
    router.replace(next === "history" ? "/library?tab=history" : "/library", { scroll: false });
  }

  const tabs: { value: Tab; label: string; icon: typeof BookMarked; count: number }[] = [
    { value: "saved", label: "Saved", icon: BookMarked, count: favorites.length },
    { value: "history", label: "History", icon: History, count: history.length },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex gap-1 rounded-lg border border-line bg-surface p-1">
          {tabs.map(({ value, label, icon: Icon, count }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
                tab === value ? "bg-accent text-accent-ink" : "text-muted hover:text-fg",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {hydrated && count > 0 && (
                <span className={cn("text-xs", tab === value ? "text-accent-ink/70" : "text-subtle")}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "history" && hydrated && history.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            {confirmClear ? (
              <>
                <span className="text-sm text-muted">Clear all reading history?</span>
                <button
                  type="button"
                  onClick={() => {
                    actions.clearHistory();
                    setConfirmClear(false);
                    toast.show("Reading history cleared", "info");
                  }}
                  className="rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-danger/90"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:text-fg"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted transition hover:border-danger/50 hover:text-danger"
              >
                <Trash2 className="size-4" aria-hidden /> Clear history
              </button>
            )}
          </div>
        )}
      </div>

      {!hydrated ? (
        <MangaGridSkeleton count={12} />
      ) : tab === "saved" ? (
        favorites.length === 0 ? (
          <EmptyState
            icon={<BookMarked className="size-5" aria-hidden />}
            title="Your library is empty"
            description="Tap “Add to library” on any series to keep it here."
            action={
              <Link href="/comics" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-ink hover:bg-accent-strong">
                Browse comics
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {favorites.map((f) => {
              const h = progressById.get(f.id);
              return (
                <div key={f.id} className="group relative flex flex-col">
                  <Link href={`/manga/${f.id}`} className="relative aspect-[2/3] overflow-hidden rounded-lg bg-elevated ring-1 ring-line transition group-hover:ring-accent/60">
                    <CoverImage src={f.cover} alt={`${f.title} cover`} sizes="200px" />
                    {h && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
                        <div className="h-full bg-accent" style={{ width: `${Math.round(h.progress * 100)}%` }} />
                      </div>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      actions.removeFavorite(f.id);
                      toast.show(`Removed “${f.title}”`, "info");
                    }}
                    className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/70 text-fg opacity-100 backdrop-blur transition hover:bg-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    aria-label={`Remove ${f.title} from library`}
                  >
                    <X className="size-4" />
                  </button>
                  <Link href={`/manga/${f.id}`} className="mt-2 line-clamp-2 text-sm font-semibold leading-snug hover:text-accent">
                    {f.title}
                  </Link>
                  <p className="mt-1 text-xs text-subtle">
                    {h ? (
                      <Link href={`/read/${h.chapterId}`} className="font-medium text-accent hover:underline">
                        Continue {h.chapterLabel}
                      </Link>
                    ) : (
                      f.status && statusLabel(f.status)
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )
      ) : history.length === 0 ? (
        <EmptyState
          icon={<History className="size-5" aria-hidden />}
          title="No reading history yet"
          description="Chapters you read are remembered here so you can pick up where you left off."
          action={
            <Link href="/latest" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-ink hover:bg-accent-strong">
              See latest updates
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {history.map((h) => (
            <li key={h.mangaId} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <Link href={`/manga/${h.mangaId}`} className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-md bg-elevated sm:w-16">
                <CoverImage src={h.cover} alt="" sizes="64px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/manga/${h.mangaId}`} className="line-clamp-1 text-sm font-semibold hover:text-accent sm:text-base">
                  {h.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  {h.chapterLabel}
                  {h.page && h.totalPages ? ` · page ${h.page} of ${h.totalPages}` : ""} ·{" "}
                  <TimeAgo date={new Date(h.updatedAt).toISOString()} />
                </p>
                <div className="mt-2 h-1 max-w-xs overflow-hidden rounded-full bg-raised">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(h.progress * 100)}%` }} />
                </div>
              </div>
              <Link
                href={`/read/${h.chapterId}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-ink transition hover:bg-accent-strong"
              >
                <BookOpen className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Continue</span>
              </Link>
              <button
                type="button"
                onClick={() => actions.removeHistory(h.mangaId)}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-elevated hover:text-danger"
                aria-label={`Remove ${h.title} from history`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
