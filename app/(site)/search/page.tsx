import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CatalogFilterBar } from "@/components/catalog/CatalogFilterBar";
import { CatalogResults } from "@/components/catalog/CatalogResults";
import { MangaGridSkeleton } from "@/components/manga/MangaCard";
import { EmptyState } from "@/components/ui/states";
import { FEATURED_GENRES } from "@/constants/site";
import { parseCatalogParams } from "@/lib/catalog";
import { getTags } from "@/lib/mangadex";
import { load } from "@/lib/utils/load";

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const { q } = parseCatalogParams(await props.searchParams);
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

async function SearchView({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const [sp, tags] = await Promise.all([searchParams, load(() => getTags())]);
  const filters = parseCatalogParams(sp);
  const allTags = tags.ok ? tags.data : [];
  const genres = allTags.filter((t) => t.group === "genre" || t.group === "theme");
  const hasCriteria = Boolean(filters.q || filters.genres.length || filters.status.length || filters.types.length);

  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {filters.q ? (
          <>
            Results for <span className="text-accent">“{filters.q}”</span>
          </>
        ) : (
          "Search"
        )}
      </h1>
      <p className="mb-6 text-sm text-muted">Search by full or partial title, in English or the original romanization.</p>
      <CatalogFilterBar filters={filters} genres={genres} basePath="/search" />

      {hasCriteria ? (
        <Suspense key={JSON.stringify(filters)} fallback={<MangaGridSkeleton count={18} />}>
          <CatalogResults filters={filters} basePath="/search" />
        </Suspense>
      ) : (
        <EmptyState
          icon={<Search className="size-5" aria-hidden />}
          title="What are you looking for?"
          description="Type a title above, or start from a popular genre."
          action={
            <div className="flex max-w-lg flex-wrap justify-center gap-1.5">
              {FEATURED_GENRES.map((name) => {
                const tag = allTags.find((t) => t.name === name);
                return tag ? (
                  <Link
                    key={tag.id}
                    href={`/comics?genres=${tag.id}`}
                    className="rounded-md border border-line bg-elevated px-2.5 py-1 text-xs font-medium text-muted transition hover:border-accent/60 hover:text-accent"
                  >
                    {name}
                  </Link>
                ) : null;
              })}
            </div>
          }
        />
      )}
    </>
  );
}

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="container-page pt-8">
      <Suspense
        fallback={
          <>
            <div className="skeleton mb-3 h-8 w-64 rounded" />
            <div className="skeleton mb-6 h-10 rounded-lg" />
            <MangaGridSkeleton count={18} />
          </>
        }
      >
        <SearchView searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
