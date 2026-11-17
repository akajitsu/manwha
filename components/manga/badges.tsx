import { Star } from "lucide-react";

import { comicTypeLabel } from "@/constants/site";
import { cn, formatRating, statusLabel } from "@/lib/utils/format";

const STATUS_STYLES: Record<string, string> = {
  ongoing: "bg-success/15 text-success ring-success/30",
  completed: "bg-info/15 text-info ring-info/30",
  hiatus: "bg-accent/15 text-accent ring-accent/30",
  cancelled: "bg-danger/15 text-danger ring-danger/30",
};

const STATUS_TEXT: Record<string, string> = {
  ongoing: "text-success",
  completed: "text-info",
  hiatus: "text-accent",
  cancelled: "text-danger",
};

/**
 * `overlay` is for badges drawn on top of cover art: a solid dark chip so the
 * label stays legible on light artwork.
 */
export function StatusBadge({
  status,
  className,
  overlay = false,
}: {
  status: string;
  className?: string;
  overlay?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        overlay
          ? cn("bg-black/80 shadow-sm backdrop-blur-sm", STATUS_TEXT[status] ?? "text-muted")
          : cn("ring-1 ring-inset", STATUS_STYLES[status] ?? "bg-raised text-muted ring-line"),
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {statusLabel(status)}
    </span>
  );
}

export function TypeBadge({ originalLanguage, className }: { originalLanguage: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fg backdrop-blur-sm",
        className,
      )}
    >
      {comicTypeLabel(originalLanguage)}
    </span>
  );
}

export function RatingBadge({ rating, className }: { rating: number | null | undefined; className?: string }) {
  const text = formatRating(rating);
  if (!text) return null;
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs font-semibold text-accent", className)}
      title="MangaDex community rating (Bayesian average)"
    >
      <Star className="size-3 fill-current" aria-hidden />
      {text}
    </span>
  );
}
