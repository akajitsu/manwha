import type { NextRequest } from "next/server";

import { MANGADEX_UPLOADS, mdFetchBinary } from "@/lib/mangadex/client";
import { isUuid } from "@/lib/utils/format";

/**
 * Cover image proxy.
 *
 * MangaDex serves deliberately wrong images to hotlinked requests and requires
 * third-party sites to proxy. This route only fetches
 * `uploads.mangadex.org/covers/{uuid}/{uuid}.{ext}[.256.jpg|.512.jpg]` — the
 * host is fixed and every path component is validated, so it cannot be used
 * as an open proxy.
 */

const FILE_RE = /^[0-9a-f-]{36}\.(?:jpe?g|png|gif|webp)$/i;
const SIZES = new Set(["256", "512"]);
const MAX_BYTES = 8 * 1024 * 1024;

// Small in-process LRU so popular covers aren't re-fetched for every visitor.
const LRU_MAX_BYTES = 64 * 1024 * 1024;
const lru = new Map<string, { body: ArrayBuffer; type: string }>();
let lruBytes = 0;

function lruGet(key: string) {
  const hit = lru.get(key);
  if (hit) {
    lru.delete(key);
    lru.set(key, hit);
  }
  return hit;
}

function lruSet(key: string, value: { body: ArrayBuffer; type: string }) {
  lru.set(key, value);
  lruBytes += value.body.byteLength;
  for (const [k, v] of lru) {
    if (lruBytes <= LRU_MAX_BYTES) break;
    lru.delete(k);
    lruBytes -= v.body.byteLength;
  }
}

function imageResponse(body: ArrayBuffer, type: string) {
  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/cover/[mangaId]/[file]">) {
  const { mangaId, file } = await ctx.params;
  const fileName = decodeURIComponent(file);
  const size = request.nextUrl.searchParams.get("size");

  if (!isUuid(mangaId) || !FILE_RE.test(fileName) || (size !== null && !SIZES.has(size))) {
    return new Response("Invalid cover request", { status: 400 });
  }

  const upstream = `${MANGADEX_UPLOADS}/covers/${mangaId}/${fileName}${size ? `.${size}.jpg` : ""}`;
  const cached = lruGet(upstream);
  if (cached) return imageResponse(cached.body, cached.type);

  let res: Response;
  try {
    res = await mdFetchBinary(upstream);
  } catch {
    return new Response("Cover unavailable", { status: 502, headers: { "Cache-Control": "no-store" } });
  }

  const type = res.headers.get("content-type") ?? "";
  const length = Number(res.headers.get("content-length") ?? 0);
  if (!res.ok || !type.startsWith("image/") || length > MAX_BYTES) {
    return new Response("Cover unavailable", {
      status: res.status === 404 ? 404 : 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let body: ArrayBuffer;
  try {
    body = await res.arrayBuffer();
  } catch {
    return new Response("Cover unavailable", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  if (body.byteLength > MAX_BYTES) {
    return new Response("Cover too large", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  lruSet(upstream, { body, type });
  return imageResponse(body, type);
}
