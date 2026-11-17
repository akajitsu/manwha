import type { Metadata } from "next";
import { Suspense } from "react";

import { LibraryView } from "@/components/library/LibraryView";
import { MangaGridSkeleton } from "@/components/manga/MangaCard";

export const metadata: Metadata = {
  title: "My Library",
  description: "Your saved series and reading history.",
  robots: { index: false },
};

export default function LibraryPage() {
  return (
    <div className="container-page pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">My library</h1>
        <p className="mt-1.5 text-sm text-muted">
          Saved series and reading progress are stored on this device only.
        </p>
      </header>
      <Suspense fallback={<MangaGridSkeleton count={12} />}>
        <LibraryView />
      </Suspense>
    </div>
  );
}
