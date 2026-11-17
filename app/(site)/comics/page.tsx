import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogFilterBar } from "@/components/catalog/CatalogFilterBar";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { MangaGridSkeleton } from "@/components/manga/MangaCard";
import { RankingListSkeleton } from "@/components/manga/RankingList";
import { PopularSidebar } from "@/components/sections/sections";
import { RecentlyUpdatedMini, SpotlightStrip } from "@/components/sections/sidebar";
import { parseCatalogParams } from "@/lib/catalog";
import { getTags } from "@/lib/mangadex";
import { load } from "@/lib/utils/load";

export const metadata: Metadata = {
  title: "Comics",
  description: "Browse the full catalog of manhwa, manga and manhua with English chapters. Filter by genre, status and type.",
};

async function Filters({ searchParams }: { searchParams: PageProps<"/comics">["searchParams"] }) {
  const [sp, tags] = await Promise.all([searchParams, load(() => getTags())]);
  const filters = parseCatalogParams(sp);
  const genres = tags.ok ? tags.data.filter((t) => t.group === "genre" || t.group === "theme") : [];
  return <CatalogFilterBar filters={filters} genres={genres} />;
}

async function Results({ searchParams }: { searchParams: PageProps<"/comics">["searchParams"] }) {
  const filters = parseCatalogParams(await searchParams);
  return (
    <Suspense key={JSON.stringify(filters)} fallback={<ResultsSkeleton />}>
      <CatalogResults filters={filters} />
    </Suspense>
  );
}

function ResultsSkeleton() {
  return (
    <div>
      <div className="skeleton mb-4 h-3 w-40 rounded" />
      <MangaGridSkeleton count={18} />
    </div>
  );
}

export default function ComicsPage(props: PageProps<"/comics">) {
  return (
    <div className="container-page pt-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Comics</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Every manhwa, manga and manhua with English chapters on MangaDex. Search, filter by genre, and sort by latest
          update, follows or rating.
        </p>
      </header>

      <Suspense fallback={<div className="skeleton mb-8 h-[260px] rounded-xl" />}>
        <SpotlightStrip />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Catalog">
          <Suspense fallback={<div className="skeleton mb-6 h-10 rounded-lg" />}>
            <Filters searchParams={props.searchParams} />
          </Suspense>
          <Suspense fallback={<ResultsSkeleton />}>
            <Results searchParams={props.searchParams} />
          </Suspense>
        </section>

        <aside className="space-y-6">
          <Suspense fallback={<div className="rounded-xl border border-line bg-surface p-4"><RankingListSkeleton /></div>}>
            <PopularSidebar count={8} />
          </Suspense>
          <Suspense fallback={<div className="skeleton h-80 rounded-xl" />}>
            <RecentlyUpdatedMini />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
