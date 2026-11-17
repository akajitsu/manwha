import type { NextRequest } from "next/server";

import { MangaDexError, getMangaFeed } from "@/lib/mangadex";
import { isUuid } from "@/lib/utils/format";

const LANG_RE = /^[a-z]{2,3}(?:-[a-z]{2,4})?$/i;

/** Paginated chapter list for the detail page's "Load more" / sort / language controls. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/manga/[id]/chapters">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const sp = request.nextUrl.searchParams;
  const language = sp.get("lang") ?? "en";
  const order = sp.get("order") === "asc" ? "asc" : "desc";
  const offset = Math.max(0, Number.parseInt(sp.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, Number.parseInt(sp.get("limit") ?? "100", 10) || 100));
  if (!LANG_RE.test(language)) return Response.json({ error: "Invalid language" }, { status: 400 });

  try {
    const feed = await getMangaFeed(id, { language, order, offset, limit });
    return Response.json(feed, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (err) {
    const status = err instanceof MangaDexError ? err.status : 500;
    return Response.json({ error: "Could not load chapters." }, { status: status === 429 ? 429 : 502 });
  }
}
