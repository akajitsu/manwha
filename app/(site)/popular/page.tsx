import { Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MangaGridSkeleton } from "@/components/manga/MangaCard";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState } from "@/components/ui/states";
import { PAGE_SIZE } from "@/constants/site";
import { getCardExtras, searchManga } from "@/lib/mangadex";
import { cn, firstParam, pageParam } from "@/lib/utils/format";
import { load } from "@/lib/utils/load";

export const metadata: Metadata = {
  title: "Popular",
  description: "The most-followed and highest-rated manhwa, manga and manhua on MangaDex.",
};

const TABS = [
  { value: "follows", label: "Most followed", description: "All-time MangaDex follower count." },
  { value: "rating", label: "Top rated", description: "MangaDex community rating (Bayesian average)." },
  { value: "new", label: "Rising", description: "Most-followed titles added to MangaDex in the past year." },
] as const;

type TabValue = (typeof TABS)[number]["value"];
const MAX_PAGE = 10;

function parse(sp: Record<string, string | string[] | undefined>) {
  const raw = firstParam(sp.tab);
  const tab: TabValue = TABS.some((t) => t.value === raw) ? (raw as TabValue) : "follows";
  return { tab, page: Math.min(pageParam(sp.page), MAX_PAGE) };
}

function href(tab: TabValue, page = 1) {
  const sp = new URLSearchParams();
  if (tab !== "follows") sp.set("tab", tab);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/popular?${qs}` : "/popular";
}

async function TabBar({ searchParams }: { searchParams: PageProps<"/popular">["searchParams"] }) {
  const { tab } = parse(await searchParams);
  const current = TABS.find((t) => t.value === tab)!;
  return (
    <>
      <nav aria-label="Ranking type" className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1 scrollbar-none sm:inline-flex">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={href(t.value)}
            aria-current={t.value === tab ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition",
              t.value === tab ? "bg-accent text-accent-ink" : "text-muted hover:text-fg",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle">
        <Info className="size-3.5" aria-hidden />
        {current.description} Rankings come directly from MangaDex data — BeanZz does not compute its own score.
      </p>
    </>
  );
}

async function Ranking({ searchParams }: { searchParams: PageProps<"/popular">["searchParams"] }) {
  const { tab, page } = parse(await searchParams);
  const res = await load(async () => {
    const list = await searchManga({
      sort: tab === "rating" ? "rating" : "follows",
      createdWithinDays: tab === "new" ? 365 : undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    });
    return { list, extras: await getCardExtras(list.items) };
  });
  if (!res.ok) return <ErrorState retryHref={href(tab, page)} />;
  const totalPages = Math.min(MAX_PAGE, Math.ceil(res.data.list.total / PAGE_SIZE));
  return (
    <>
      <MangaGrid items={res.data.list.items} extras={res.data.extras} startRank={(page - 1) * PAGE_SIZE + 1} />
      <Pagination page={page} totalPages={totalPages} buildHref={(p) => href(tab, p)} />
    </>
  );
}

export default function PopularPage(props: PageProps<"/popular">) {
  return (
    <div className="container-page pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Popular</h1>
        <p className="mt-1.5 text-sm text-muted">The series MangaDex readers follow and rate the most.</p>
      </header>
      <div className="mb-6">
        <Suspense fallback={<div className="skeleton h-11 w-80 max-w-full rounded-lg" />}>
          <TabBar searchParams={props.searchParams} />
        </Suspense>
      </div>
      <Suspense fallback={<MangaGridSkeleton count={18} />}>
        <Ranking searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
