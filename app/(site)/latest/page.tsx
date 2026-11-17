import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { UpdateCard, UpdateCardSkeleton } from "@/components/manga/UpdateCard";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { getRecentUpdates } from "@/lib/mangadex";
import { pageParam } from "@/lib/utils/format";
import { load } from "@/lib/utils/load";

export const metadata: Metadata = {
  title: "Latest Updates",
  description: "The newest English chapters released on MangaDex, grouped by series.",
};

const MAX_PAGE = 100; // MangaDex caps result windows at 10,000 items.

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

async function Updates({ searchParams }: { searchParams: PageProps<"/latest">["searchParams"] }) {
  const page = Math.min(pageParam((await searchParams).page), MAX_PAGE);
  const res = await load(() => getRecentUpdates(page));
  if (!res.ok) return <ErrorState retryHref={`/latest?page=${page}`} />;
  const { updates, hasMore } = res.data;
  if (updates.length === 0) return <EmptyState title="No more updates" description="You've reached the end of the update feed." />;

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-fg";
  return (
    <>
      <Grid>
        {updates.map((u, i) => (
          <UpdateCard key={u.manga.id} update={u} priority={i < 6} />
        ))}
      </Grid>
      <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
        {page > 1 && (
          <Link href={page === 2 ? "/latest" : `/latest?page=${page - 1}`} className={btn}>
            <ChevronLeft className="size-4" /> Newer
          </Link>
        )}
        <span className="text-sm text-subtle">Page {page}</span>
        {hasMore && page < MAX_PAGE && (
          <Link href={`/latest?page=${page + 1}`} className={btn}>
            Older <ChevronRight className="size-4" />
          </Link>
        )}
      </nav>
    </>
  );
}

export default function LatestPage(props: PageProps<"/latest">) {
  return (
    <div className="container-page pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Latest updates</h1>
        <p className="mt-1.5 text-sm text-muted">
          Newly released English chapters hosted on MangaDex, newest first. Each card shows a series&apos; most recent
          chapters.
        </p>
      </header>
      <Suspense
        fallback={
          <Grid>
            {Array.from({ length: 12 }, (_, i) => (
              <UpdateCardSkeleton key={i} />
            ))}
          </Grid>
        }
      >
        <Updates searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
