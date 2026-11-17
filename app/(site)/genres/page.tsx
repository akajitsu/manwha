import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CoverImage } from "@/components/manga/CoverImage";
import { ErrorState } from "@/components/ui/states";
import { FEATURED_GENRES } from "@/constants/site";
import { getTags, searchManga } from "@/lib/mangadex";
import { load } from "@/lib/utils/load";
import type { Tag } from "@/types/manga";

export const metadata: Metadata = {
  title: "Genres",
  description: "Explore manhwa, manga and manhua by genre, theme and format.",
};

const GROUP_LABELS: Record<Tag["group"], { title: string; description: string }> = {
  genre: { title: "Genres", description: "The core storytelling categories." },
  theme: { title: "Themes", description: "Settings, tropes and recurring elements." },
  format: { title: "Formats", description: "How the work is published and presented." },
  content: { title: "Content", description: "Content descriptors." },
};

async function GenreTile({ tag }: { tag: Tag }) {
  const res = await load(() => searchManga({ includedTags: [tag.id], sort: "follows", limit: 3 }));
  const covers = res.ok ? res.data.items : [];
  return (
    <Link
      href={`/comics?genres=${tag.id}`}
      className="group relative flex h-44 overflow-hidden rounded-xl border border-line bg-surface p-4 transition hover:border-accent/50"
    >
      <div className="relative z-10 flex flex-col">
        <h3 className="text-lg font-bold text-fg transition group-hover:text-accent">{tag.name}</h3>
        {res.ok && (
          <p className="mt-0.5 text-xs text-subtle">{res.data.total.toLocaleString("en")} titles</p>
        )}
        <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-muted transition group-hover:text-accent">
          Browse <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
      <div className="absolute -right-2 bottom-3 top-3 flex items-end" aria-hidden>
        {covers.map((m, i) => (
          <div
            key={m.id}
            className="relative -ml-10 aspect-[2/3] h-full overflow-hidden rounded-lg shadow-xl shadow-black/60 ring-1 ring-black/50 transition duration-300 first:ml-0 group-hover:-translate-y-1"
            style={{ transform: `rotate(${(i - 1) * 6}deg)`, zIndex: 3 - i }}
          >
            <CoverImage src={m.cover?.thumb} alt="" sizes="100px" />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-surface via-surface/80 to-transparent" />
    </Link>
  );
}

async function GenreDirectory() {
  const res = await load(() => getTags());
  if (!res.ok) return <ErrorState retryHref="/genres" />;
  const tags = res.data;
  const featured = FEATURED_GENRES.map((name) => tags.find((t) => t.name === name)).filter((t): t is Tag => Boolean(t));

  return (
    <>
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold">Popular genres</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((tag) => (
            <Suspense key={tag.id} fallback={<div className="skeleton h-44 rounded-xl" />}>
              <GenreTile tag={tag} />
            </Suspense>
          ))}
        </div>
      </section>

      {(["genre", "theme", "format"] as const).map((group) => {
        const list = tags.filter((t) => t.group === group);
        if (list.length === 0) return null;
        return (
          <section key={group} className="mb-10">
            <h2 className="text-lg font-bold">{GROUP_LABELS[group].title}</h2>
            <p className="mb-4 text-sm text-subtle">{GROUP_LABELS[group].description}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {list.map((t) => (
                <Link
                  key={t.id}
                  href={`/comics?genres=${t.id}`}
                  className="truncate rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-accent"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

export default function GenresPage() {
  return (
    <div className="container-page pt-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Genres</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every category MangaDex supports. Pick one to browse matching titles, or combine several on the{" "}
          <Link href="/comics" className="text-accent hover:underline">
            comics page
          </Link>
          .
        </p>
      </header>
      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton h-44 rounded-xl" />
            ))}
          </div>
        }
      >
        <GenreDirectory />
      </Suspense>
    </div>
  );
}
