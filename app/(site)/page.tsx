import { Clock } from "lucide-react";
import { Suspense } from "react";

import { ContinueReading } from "@/components/manga/ContinueReading";
import { HeroSkeleton } from "@/components/manga/HeroCarousel";
import { MangaGridSkeleton } from "@/components/manga/MangaCard";
import { RankingListSkeleton } from "@/components/manga/RankingList";
import { UpdateCardSkeleton } from "@/components/manga/UpdateCard";
import {
  FeaturedSection,
  GenreCloud,
  LatestUpdatesSection,
  NewSeriesSection,
  PopularSidebar,
} from "@/components/sections/sections";
import { SectionHeader } from "@/components/ui/states";

function LatestSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <UpdateCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <FeaturedSection />
      </Suspense>

      <div className="container-page">
        <ContinueReading />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <SectionHeader
              title="Latest updates"
              subtitle="New English chapters, as they land on MangaDex"
              icon={<Clock className="size-5" />}
              href="/latest"
            />
            <Suspense fallback={<LatestSkeleton />}>
              <LatestUpdatesSection count={18} />
            </Suspense>
          </section>

          <aside className="space-y-6">
            <Suspense
              fallback={
                <div className="rounded-xl border border-line bg-surface p-4">
                  <div className="skeleton mb-4 h-5 w-24 rounded" />
                  <RankingListSkeleton />
                </div>
              }
            >
              <PopularSidebar />
            </Suspense>
            <Suspense fallback={<div className="skeleton h-48 rounded-xl" />}>
              <GenreCloud />
            </Suspense>
          </aside>
        </div>

        <div className="mt-12">
          <Suspense fallback={<MangaGridSkeleton count={12} />}>
            <NewSeriesSection />
          </Suspense>
        </div>
      </div>
    </>
  );
}
