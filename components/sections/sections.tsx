import { Flame, Sparkles, Tags } from "lucide-react";
import Link from "next/link";

import { HeroCarousel } from "@/components/manga/HeroCarousel";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { RankingList } from "@/components/manga/RankingList";
import { UpdateCard } from "@/components/manga/UpdateCard";
import { ErrorState, SectionHeader } from "@/components/ui/states";
import { Tabs } from "@/components/ui/Tabs";
import { getCardExtras, getFeatured, getRecentUpdates, getStatistics, getTags, searchManga } from "@/lib/mangadex";
import { load } from "@/lib/utils/load";

export async function FeaturedSection() {
  const res = await load(() => getFeatured(6));
  if (!res.ok || res.data.length === 0) return null;
  return <HeroCarousel items={res.data} />;
}

export async function LatestUpdatesSection({ count = 18 }: { count?: number }) {
  const res = await load(() => getRecentUpdates(1));
  if (!res.ok) return <ErrorState retryHref="/latest" />;
  const updates = res.data.updates.slice(0, count);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {updates.map((u, i) => (
        <UpdateCard key={u.manga.id} update={u} priority={i < 4} />
      ))}
    </div>
  );
}

/** Sidebar rankings: MangaDex follows (all-time), community rating, and new series. */
export async function PopularSidebar({ count = 10 }: { count?: number }) {
  const res = await load(async () => {
    const [followed, rated, fresh] = await Promise.all([
      searchManga({ sort: "follows", limit: count }),
      searchManga({ sort: "rating", limit: count }),
      searchManga({ sort: "follows", limit: count, createdWithinDays: 365 }),
    ]);
    const stats = await getStatistics([...followed.items, ...rated.items, ...fresh.items].map((m) => m.id));
    return { followed, rated, fresh, stats };
  });

  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <SectionHeader
        title="Popular"
        subtitle="Ranked by MangaDex follows & ratings"
        icon={<Flame className="size-5" />}
        href="/popular"
      />
      {res.ok ? (
        <Tabs
          tabs={[
            { label: "All time", content: <RankingList items={res.data.followed.items} stats={res.data.stats} /> },
            { label: "Top rated", content: <RankingList items={res.data.rated.items} stats={res.data.stats} /> },
            { label: "New", content: <RankingList items={res.data.fresh.items} stats={res.data.stats} /> },
          ]}
        />
      ) : (
        <ErrorState className="py-6" retryHref="/popular" />
      )}
    </section>
  );
}

export async function GenreCloud({ limit = 24 }: { limit?: number }) {
  const res = await load(() => getTags());
  if (!res.ok) return null;
  const genres = res.data.filter((t) => t.group === "genre").slice(0, limit);
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <SectionHeader title="Genres" icon={<Tags className="size-5" />} href="/genres" />
      <div className="flex flex-wrap gap-1.5">
        {genres.map((g) => (
          <Link
            key={g.id}
            href={`/comics?genre=${g.id}`}
            className="rounded-md border border-line bg-elevated px-2.5 py-1 text-xs font-medium text-muted transition hover:border-accent/60 hover:text-accent"
          >
            {g.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function NewSeriesSection({ count = 12 }: { count?: number }) {
  const res = await load(async () => {
    const list = await searchManga({ sort: "follows", limit: count, createdWithinDays: 120 });
    return { list, extras: await getCardExtras(list.items) };
  });
  return (
    <section>
      <SectionHeader
        title="Rising new series"
        subtitle="Most-followed titles added to MangaDex in the last 4 months"
        icon={<Sparkles className="size-5" />}
        href="/popular?tab=new"
      />
      {res.ok ? (
        <MangaGrid
          items={res.data.list.items}
          extras={res.data.extras}
          className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          priorityCount={0}
        />
      ) : (
        <ErrorState />
      )}
    </section>
  );
}
