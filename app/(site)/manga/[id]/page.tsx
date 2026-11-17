import { ExternalLink, ShieldAlert, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StatusBadge } from "@/components/manga/badges";
import { ChapterList } from "@/components/manga/ChapterList";
import { CoverImage } from "@/components/manga/CoverImage";
import { Description } from "@/components/manga/Description";
import { DetailActions } from "@/components/manga/DetailActions";
import { Expandable } from "@/components/ui/Expandable";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { isRemovedManga } from "@/constants/removals";
import { DEFAULT_LANGUAGE, comicTypeLabel, languageName } from "@/constants/site";
import {
  ALLOWED_CONTENT_RATINGS,
  getFirstReadableChapter,
  getManga,
  getMangaFeed,
  getStatistics,
} from "@/lib/mangadex";
import { chapterLabel, formatCompact, formatRating, isUuid, statusLabel } from "@/lib/utils/format";
import { load } from "@/lib/utils/load";

export async function generateMetadata(props: PageProps<"/manga/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  if (!isUuid(id)) return { title: "Not found" };
  const res = await load(() => getManga(id));
  if (!res.ok || !res.data) return { title: "Series" };
  const m = res.data;
  return {
    title: m.title,
    description: m.description.slice(0, 160) || `Read ${m.title} on Inkmoon.`,
    openGraph: {
      title: m.title,
      description: m.description.slice(0, 200),
      images: m.cover ? [{ url: m.cover.medium }] : undefined,
    },
  };
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-subtle">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-fg">{children}</dd>
    </div>
  );
}

async function MangaDetailView({ params }: { params: PageProps<"/manga/[id]">["params"] }) {
  const { id } = await params;
  if (!isUuid(id) || isRemovedManga(id)) notFound();

  const res = await load(() => getManga(id));
  if (!res.ok) return <div className="container-page pt-10"><ErrorState retryHref={`/manga/${id}`} /></div>;
  const manga = res.data;
  if (!manga) notFound();

  if (!ALLOWED_CONTENT_RATINGS.has(manga.contentRating)) {
    return (
      <div className="container-page pt-10">
        <EmptyState
          icon={<ShieldAlert className="size-5" aria-hidden />}
          title="This title isn't available on Inkmoon"
          description="Inkmoon only lists series rated safe or suggestive on MangaDex."
          action={<Link href="/comics" className="text-sm font-semibold text-accent hover:underline">Browse comics</Link>}
        />
      </div>
    );
  }

  const languages = manga.availableLanguages.length ? [...manga.availableLanguages].sort() : [DEFAULT_LANGUAGE];
  const language = languages.includes(DEFAULT_LANGUAGE) ? DEFAULT_LANGUAGE : languages[0];

  const [statsRes, firstRes, feedRes] = await Promise.all([
    load(() => getStatistics([id])),
    load(() => getFirstReadableChapter(id, language)),
    load(() => getMangaFeed(id, { language, order: "desc", limit: 100 })),
  ]);
  const stats = statsRes.ok ? statsRes.data[id] : undefined;
  const first = firstRes.ok ? firstRes.data : null;
  const feed = feedRes.ok ? feedRes.data : null;
  const latest = feed?.items[0];
  const officialUrl = feed?.items.find((c) => c.externalUrl)?.externalUrl ?? null;
  const rating = formatRating(stats?.rating);

  return (
    <article>
      {/* Backdrop */}
      <div className="relative h-56 overflow-hidden sm:h-72" aria-hidden>
        {manga.cover && (
          <Image
            src={manga.cover.medium}
            alt=""
            fill
            unoptimized
            loading="eager"
            sizes="100vw"
            className="scale-110 object-cover object-[center_30%] opacity-35 blur-xl"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-bg/30 via-bg/70 to-bg" />
      </div>

      <div className="container-page relative -mt-40 sm:-mt-52">
        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <div className="relative mx-auto aspect-[2/3] w-44 overflow-hidden rounded-xl bg-elevated shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:w-52 md:w-full">
              <CoverImage src={manga.cover?.medium} alt={`${manga.title} cover`} priority sizes="(max-width: 768px) 208px, 240px" />
            </div>
            <DetailActions
              manga={{ id: manga.id, title: manga.title, cover: manga.cover?.thumb ?? null, status: manga.status }}
              firstChapter={first ? { id: first.id, label: chapterLabel(first) } : null}
              officialUrl={officialUrl}
            />
            {(rating || stats?.follows) && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-line bg-surface p-3 text-center">
                  <p className="flex items-center justify-center gap-1 text-lg font-bold text-accent">
                    <Star className="size-4 fill-current" aria-hidden />
                    {rating ?? "—"}
                  </p>
                  <p className="text-[11px] text-subtle">MangaDex rating</p>
                </div>
                <div className="rounded-lg border border-line bg-surface p-3 text-center">
                  <p className="flex items-center justify-center gap-1 text-lg font-bold text-fg">
                    <Users className="size-4" aria-hidden />
                    {formatCompact(stats?.follows)}
                  </p>
                  <p className="text-[11px] text-subtle">Follows</p>
                </div>
              </div>
            )}
            <dl className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
              <InfoRow label="Status">{statusLabel(manga.status)}</InfoRow>
              <InfoRow label="Type">{comicTypeLabel(manga.originalLanguage)}</InfoRow>
              {manga.year && <InfoRow label="Released">{manga.year}</InfoRow>}
              {manga.demographic && <InfoRow label="Demographic">{statusLabel(manga.demographic)}</InfoRow>}
              <InfoRow label="Original language">{languageName(manga.originalLanguage)}</InfoRow>
              {latest && <InfoRow label="Latest">{chapterLabel(latest)}</InfoRow>}
              {manga.lastChapter && manga.status === "completed" && <InfoRow label="Final chapter">{manga.lastChapter}</InfoRow>}
            </dl>
          </div>

          {/* Right column */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={manga.status} />
              <span className="rounded bg-raised px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                {comicTypeLabel(manga.originalLanguage)}
              </span>
              {manga.contentRating === "suggestive" && (
                <span className="rounded bg-danger/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
                  Suggestive
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{manga.title}</h1>
            {manga.altTitles.length > 0 && (
              <p className="mt-2 line-clamp-2 text-sm text-muted" title={manga.altTitles.join(" · ")}>
                {manga.altTitles.join(" · ")}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {manga.authors.length > 0 && (
                <p>
                  <span className="text-subtle">Author </span>
                  <span className="font-medium">{manga.authors.map((a) => a.name).join(", ")}</span>
                </p>
              )}
              {manga.artists.length > 0 && (
                <p>
                  <span className="text-subtle">Artist </span>
                  <span className="font-medium">{manga.artists.map((a) => a.name).join(", ")}</span>
                </p>
              )}
            </div>

            {manga.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {manga.tags
                  .filter((t) => t.group === "genre" || t.group === "theme")
                  .map((t) => (
                    <Link
                      key={t.id}
                      href={`/comics?genres=${t.id}`}
                      className={
                        t.group === "genre"
                          ? "rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20"
                          : "rounded-md border border-line bg-elevated px-2.5 py-1 text-xs font-medium text-muted transition hover:text-fg"
                      }
                    >
                      {t.name}
                    </Link>
                  ))}
              </div>
            )}

            <div className="mt-6 text-[15px] leading-relaxed text-muted">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-fg">Synopsis</h2>
              {manga.descriptionMarkdown.length > 600 ? (
                <Expandable>
                  <Description markdown={manga.descriptionMarkdown} />
                </Expandable>
              ) : (
                <Description markdown={manga.descriptionMarkdown} />
              )}
            </div>

            {manga.availableLanguages.length > 0 && (
              <div className="mt-5">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-fg">Available translations</h2>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l) => (
                    <span
                      key={l}
                      className={
                        l === DEFAULT_LANGUAGE
                          ? "rounded bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent"
                          : "rounded bg-elevated px-2 py-0.5 text-xs text-muted"
                      }
                    >
                      {languageName(l)}
                    </span>
                  ))}
                </div>
              </div>
            )}

              <div className="mt-5 flex flex-wrap gap-2">
                {manga.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-line-strong hover:text-fg"
                  >
                    {l.label}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ))}
                <a
                  href={`https://mangadex.org/title/${manga.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-line-strong hover:text-fg"
                >
                  MangaDex
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              </div>

            {!first && (
              <p className="mt-6 rounded-lg border border-info/25 bg-info/5 px-4 py-3 text-sm text-muted">
                {officialUrl
                  ? "This series' English chapters are published officially and hosted by the publisher — chapters below open on the official site."
                  : `No ${languageName(language)} chapters are currently hosted on MangaDex for this series.`}
              </p>
            )}

            <div className="mt-8">
              {feed ? (
                <ChapterList mangaId={manga.id} initial={feed} initialLanguage={language} languages={languages} />
              ) : (
                <ErrorState title="Couldn't load chapters" retryHref={`/manga/${manga.id}`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div aria-hidden>
      <div className="h-56 sm:h-72" />
      <div className="container-page -mt-40 sm:-mt-52">
        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-3">
            <div className="skeleton mx-auto aspect-[2/3] w-44 rounded-xl sm:w-52 md:w-full" />
            <div className="skeleton h-10 rounded-lg" />
            <div className="skeleton h-10 rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-10 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="space-y-2 pt-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="skeleton h-3.5 rounded" />
              ))}
            </div>
            <div className="skeleton mt-8 h-96 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MangaPage(props: PageProps<"/manga/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <MangaDetailView params={props.params} />
    </Suspense>
  );
}
