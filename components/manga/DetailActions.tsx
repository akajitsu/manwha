"use client";

import { BookOpen, BookmarkCheck, BookmarkPlus, ExternalLink, History } from "lucide-react";
import Link from "next/link";

import { useToast } from "@/components/ui/Toast";
import { useHydrated, useLibrary } from "@/hooks/useLibrary";
import { cn } from "@/lib/utils/format";

interface Props {
  manga: { id: string; title: string; cover: string | null; status: string };
  firstChapter: { id: string; label: string } | null;
  officialUrl: string | null;
}

export function FavoriteButton({ manga, className }: { manga: Props["manga"]; className?: string }) {
  const { favorites, actions } = useLibrary();
  const hydrated = useHydrated();
  const toast = useToast();
  const saved = favorites.some((f) => f.id === manga.id);

  return (
    <button
      type="button"
      disabled={!hydrated}
      onClick={() => {
        const added = actions.toggleFavorite(manga);
        toast.show(added ? `Added “${manga.title}” to your library` : `Removed from your library`, added ? "success" : "info");
      }}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60",
        saved
          ? "border-accent/60 bg-accent/10 text-accent hover:bg-accent/15"
          : "border-line-strong bg-elevated text-fg hover:border-fg/40",
        className,
      )}
    >
      {saved ? <BookmarkCheck className="size-4" aria-hidden /> : <BookmarkPlus className="size-4" aria-hidden />}
      {saved ? "In library" : "Add to library"}
    </button>
  );
}

export function DetailActions({ manga, firstChapter, officialUrl }: Props) {
  const { history } = useLibrary();
  const entry = history.find((h) => h.mangaId === manga.id);

  return (
    <div className="flex flex-col gap-2">
      {entry && (
        <Link
          href={`/read/${entry.chapterId}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition hover:bg-accent-strong"
        >
          <History className="size-4" aria-hidden />
          Continue {entry.chapterLabel}
        </Link>
      )}
      {firstChapter ? (
        <Link
          href={`/read/${firstChapter.id}`}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition",
            entry
              ? "border border-line-strong bg-elevated text-fg hover:border-fg/40"
              : "bg-accent text-accent-ink hover:bg-accent-strong",
          )}
        >
          <BookOpen className="size-4" aria-hidden />
          Read first chapter
        </Link>
      ) : officialUrl ? (
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition hover:bg-accent-strong"
        >
          <ExternalLink className="size-4" aria-hidden />
          Read officially
        </a>
      ) : null}
      <FavoriteButton manga={manga} />
    </div>
  );
}
