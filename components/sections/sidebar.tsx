import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";

import { CoverImage } from "@/components/manga/CoverImage";
import { ErrorState, SectionHeader } from "@/components/ui/states";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { getFeatured, getRecentUpdates } from "@/lib/mangadex";
import { chapterShortLabel } from "@/lib/utils/format";
import { load } from "@/lib/utils/load";

/** Compact "recently updated" list for sidebars. */
export async function RecentlyUpdatedMini({ count = 8 }: { count?: number }) {
  const res = await load(() => getRecentUpdates(1));
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <SectionHeader title="Just updated" icon={<Clock className="size-5" />} href="/latest" />
      {res.ok ? (
        <ul className="space-y-3">
          {res.data.updates.slice(0, count).map(({ manga, chapters }) => (
            <li key={manga.id} className="flex gap-3">
              <Link href={`/manga/${manga.id}`} className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-md bg-elevated">
                <CoverImage src={manga.cover?.thumb} alt="" sizes="44px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/manga/${manga.id}`} className="line-clamp-1 text-[13px] font-semibold text-fg hover:text-accent">
                  {manga.title}
                </Link>
                {chapters[0] && (
                  <Link href={`/read/${chapters[0].id}`} className="mt-1 flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted hover:text-fg">{chapterShortLabel(chapters[0])}</span>
                    <TimeAgo date={chapters[0].publishedAt} className="text-[11px] text-subtle" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ErrorState className="py-6" />
      )}
    </section>
  );
}

/** Horizontal spotlight strip of featured titles with fresh chapters. */
export async function SpotlightStrip({ count = 10 }: { count?: number }) {
  const res = await load(() => getFeatured(count));
  if (!res.ok || res.data.length === 0) return null;
  return (
    <section className="mb-8">
      <SectionHeader
        title="Spotlight"
        subtitle="Popular series with brand-new English chapters"
        icon={<Sparkles className="size-5" />}
      />
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {res.data.map(({ manga, latest }, i) => (
          <Link
            key={manga.id}
            href={`/manga/${manga.id}`}
            className="group relative aspect-[3/4] w-[150px] shrink-0 snap-start overflow-hidden rounded-xl bg-elevated ring-1 ring-line transition hover:ring-accent/60 sm:w-[180px]"
          >
            <CoverImage
              src={manga.cover?.medium}
              alt={`${manga.title} cover`}
              sizes="180px"
              priority={i < 4}
              className="transition duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <span className="mb-1.5 inline-block rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent-ink">
                {chapterShortLabel(latest)}
              </span>
              <p className="line-clamp-2 text-sm font-bold leading-snug text-white">{manga.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
