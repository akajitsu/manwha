import { MangaGrid } from "@/components/manga/MangaGrid";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { PAGE_SIZE } from "@/constants/site";
import { catalogHref, maxPages, typesToLanguages, type CatalogFilters } from "@/lib/catalog";
import { getCardExtras, searchManga } from "@/lib/mangadex";
import { load } from "@/lib/utils/load";

export async function CatalogResults({
  filters,
  basePath = "/comics",
}: {
  filters: CatalogFilters;
  basePath?: string;
}) {
  const res = await load(async () => {
    const list = await searchManga({
      title: filters.q || undefined,
      includedTags: filters.genres,
      status: filters.status,
      originalLanguage: typesToLanguages(filters.types),
      sort: filters.sort,
      limit: PAGE_SIZE,
      offset: (filters.page - 1) * PAGE_SIZE,
    });
    return { list, extras: await getCardExtras(list.items) };
  });

  if (!res.ok) return <ErrorState retryHref={catalogHref(filters, basePath)} />;
  const { list, extras } = res.data;
  const totalPages = maxPages(list.total);

  if (list.items.length === 0) {
    return (
      <EmptyState
        title="No titles found"
        description={
          filters.page > 1
            ? "This page is past the end of the results."
            : "Nothing matches these filters with English chapters available. Try removing a genre or broadening your search."
        }
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <p className="mb-4 text-xs text-subtle">
        {list.total.toLocaleString("en")}
        {list.total >= 10_000 ? "+" : ""} titles · page {filters.page} of {totalPages}
      </p>
      <MangaGrid items={list.items} extras={extras} />
      <Pagination
        page={filters.page}
        totalPages={totalPages}
        buildHref={(page) => catalogHref({ ...filters, page }, basePath)}
      />
    </div>
  );
}
