import type { NextRequest } from "next/server";

import { MangaDexError, searchManga } from "@/lib/mangadex";

/** Lightweight title search used by the header's instant-search dropdown. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return Response.json({ items: [], total: 0 });

  try {
    const result = await searchManga({ title: q, sort: "relevance", limit: 8 });
    return Response.json(
      {
        total: result.total,
        items: result.items.map((m) => ({
          id: m.id,
          title: m.title,
          cover: m.cover?.thumb ?? null,
          status: m.status,
          year: m.year,
          originalLanguage: m.originalLanguage,
        })),
      },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  } catch (err) {
    const status = err instanceof MangaDexError ? err.status : 500;
    return Response.json({ error: "Search is temporarily unavailable." }, { status: status === 429 ? 429 : 502 });
  }
}
