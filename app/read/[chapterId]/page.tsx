import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { LogoMark } from "@/components/layout/Logo";
import { Reader } from "@/components/reader/Reader";
import { ErrorState } from "@/components/ui/states";
import { isRemovedChapter, isRemovedManga } from "@/constants/removals";
import { ALLOWED_CONTENT_RATINGS, getChapter, getManga, getReadableChapterList } from "@/lib/mangadex";
import { getAtHome } from "@/lib/mangadex/at-home";
import { adjacentChapter, chapterOptions } from "@/lib/reader";
import { chapterLabel, chapterShortLabel, isUuid } from "@/lib/utils/format";
import { load } from "@/lib/utils/load";

export async function generateMetadata(props: PageProps<"/read/[chapterId]">): Promise<Metadata> {
  const { chapterId } = await props.params;
  if (!isUuid(chapterId)) return { title: "Chapter not found" };
  const res = await load(() => getChapter(chapterId));
  if (!res.ok || !res.data) return { title: "Reader" };
  const { chapter, manga } = res.data;
  return {
    title: `${manga?.title ?? "Chapter"} — ${chapterLabel(chapter)}`,
    robots: { index: false },
  };
}

function Notice({ title, children, backHref }: { title: string; children: ReactNode; backHref: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <LogoMark className="mb-6 size-10" />
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="mt-2 max-w-md text-sm leading-relaxed text-muted">{children}</div>
      <Link href={backHref} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back
      </Link>
    </div>
  );
}

async function ReaderView({ params }: { params: PageProps<"/read/[chapterId]">["params"] }) {
  const { chapterId } = await params;
  if (!isUuid(chapterId)) notFound();

  const chapterRes = await load(() => getChapter(chapterId));
  if (!chapterRes.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ErrorState title="Couldn't load this chapter" retryHref={`/read/${chapterId}`} className="w-full max-w-lg" />
      </div>
    );
  }
  if (!chapterRes.data) notFound();
  const { chapter, manga } = chapterRes.data;
  const backHref = manga ? `/manga/${manga.id}` : "/";

  if (isRemovedChapter(chapter) || (manga && isRemovedManga(manga.id))) {
    return (
      <Notice title="Chapter removed" backHref={backHref}>
        This chapter has been removed at the request of its scanlation group.
      </Notice>
    );
  }

  if (manga && !ALLOWED_CONTENT_RATINGS.has(manga.contentRating)) {
    return (
      <Notice title="Not available" backHref="/">
        <ShieldAlert className="mx-auto mb-2 size-5" /> This title isn&apos;t available on Inkmoon.
      </Notice>
    );
  }

  if (chapter.externalUrl) {
    return (
      <Notice title={`${manga?.title ?? "This series"} — ${chapterLabel(chapter)}`} backHref={backHref}>
        <p>This chapter is an official release hosted by the publisher, not on MangaDex.</p>
        <a
          href={chapter.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink hover:bg-accent-strong"
        >
          Read on the official site <ExternalLink className="size-4" />
        </a>
      </Notice>
    );
  }

  const [atHomeRes, navRes, mangaRes] = await Promise.all([
    load(() => getAtHome(chapterId)),
    manga ? load(() => getReadableChapterList(manga.id, chapter.language)) : Promise.resolve(null),
    manga ? load(() => getManga(manga.id)) : Promise.resolve(null),
  ]);

  if (!atHomeRes.ok) {
    return (
      <Notice title="Pages are temporarily unavailable" backHref={backHref}>
        MangaDex couldn&apos;t provide an image server for this chapter right now. Please try again in a minute.
        <div className="mt-4">
          <Link href={`/read/${chapterId}`} className="font-semibold text-accent hover:underline">
            Retry
          </Link>
        </div>
      </Notice>
    );
  }

  const pageCounts = {
    data: atHomeRes.data.chapter.data.length,
    "data-saver": atHomeRes.data.chapter.dataSaver.length,
  };
  if (pageCounts.data === 0 && pageCounts["data-saver"] === 0) {
    return (
      <Notice title="No pages" backHref={backHref}>
        MangaDex doesn&apos;t have any pages for this chapter.
      </Notice>
    );
  }

  const list = navRes && navRes.ok ? navRes.data : [];
  const index = list.findIndex((c) => c.id === chapter.id);
  const prev = index >= 0 ? adjacentChapter(list, index, -1) : null;
  const next = index >= 0 ? adjacentChapter(list, index, 1) : null;
  const options =
    index >= 0
      ? chapterOptions(list, chapter.id)
      : [{ id: chapter.id, label: `${chapterShortLabel(chapter)}${chapter.title ? ` — ${chapter.title}` : ""}` }];

  return (
    <Reader
      key={chapter.id}
      chapter={{
        id: chapter.id,
        label: chapterLabel(chapter),
        shortLabel: chapterShortLabel(chapter),
        title: chapter.title,
        number: chapter.number,
        language: chapter.language,
        groups: chapter.groups,
      }}
      manga={{
        id: manga?.id ?? "",
        title: manga?.title ?? "Unknown series",
        cover: mangaRes && mangaRes.ok ? (mangaRes.data?.cover?.thumb ?? null) : null,
      }}
      pageCounts={pageCounts}
      prev={prev}
      next={next}
      options={options}
    />
  );
}

function ReaderSkeleton() {
  return (
    <div aria-hidden>
      <div className="fixed inset-x-0 top-0 h-14 border-b border-line bg-bg" />
      <div className="mx-auto max-w-[760px] space-y-1 pt-20">
        <div className="skeleton mx-auto mb-4 h-3 w-48 rounded" />
        <div className="skeleton h-[80vh] w-full" />
      </div>
    </div>
  );
}

export default function ReadPage(props: PageProps<"/read/[chapterId]">) {
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <ReaderView params={props.params} />
    </Suspense>
  );
}
