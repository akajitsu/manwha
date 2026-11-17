import { REMOVED_GROUP_IDS, isRemovedChapter } from "@/constants/removals";
import { getChapter } from "@/lib/mangadex";
import { buildPageUrl, getAtHome, pageFiles, reportAtHome } from "@/lib/mangadex/at-home";
import { mdFetchBinary } from "@/lib/mangadex/client";
import { isUuid } from "@/lib/utils/format";
import type { ImageQuality } from "@/types/manga";

/**
 * Chapter page proxy.
 *
 * The browser asks for `/api/chapter-image/{chapterId}/{quality}/{pageIndex}`.
 * The server resolves the image through `GET /at-home/server/{chapterId}`,
 * builds the upstream URL from the returned baseUrl/hash/filename (never from
 * user input), and streams it to the client. Every retrieval is reported to
 * MangaDex@Home as its documentation requires. If a node fails before sending
 * an image, the at-home data is refreshed and the image retried once.
 */

const QUALITIES = new Set<ImageQuality>(["data", "data-saver"]);

/** Content-removal check (constants/removals.ts). Group checks use the cached chapter record. */
async function isBlocked(chapterId: string): Promise<boolean> {
  if (isRemovedChapter({ id: chapterId })) return true;
  if (REMOVED_GROUP_IDS.length === 0) return false;
  try {
    const data = await getChapter(chapterId);
    return data ? isRemovedChapter(data.chapter) : false;
  } catch {
    return false;
  }
}

/**
 * Starts the upstream request. Resolves with a streaming Response once
 * headers arrive, or null on failure (after reporting it).
 */
async function openPage(url: string): Promise<Response | null> {
  const started = performance.now();
  let res: Response;
  try {
    res = await mdFetchBinary(url);
  } catch {
    void reportAtHome({ url, success: false, cached: false, bytes: 0, duration: Math.round(performance.now() - started) });
    return null;
  }

  const type = res.headers.get("content-type") ?? "";
  const cached = (res.headers.get("x-cache") ?? "").toUpperCase().startsWith("HIT");
  if (!res.ok || !type.startsWith("image/") || !res.body) {
    void res.body?.cancel();
    void reportAtHome({ url, success: false, cached, bytes: 0, duration: Math.round(performance.now() - started) });
    return null;
  }

  // Count bytes as they stream through, and report once the transfer ends.
  let bytes = 0;
  let reported = false;
  const report = (success: boolean) => {
    if (reported) return;
    reported = true;
    void reportAtHome({ url, success, cached, bytes, duration: Math.round(performance.now() - started) });
  };
  const counter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      bytes += chunk.byteLength;
      controller.enqueue(chunk);
    },
    flush() {
      report(true);
    },
  });
  // Wrapped in a pull stream so upstream errors and client disconnects
  // mid-transfer are reported as failures too.
  const reader = res.body.pipeThrough(counter).getReader();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (err) {
        report(false);
        controller.error(err);
      }
    },
    cancel(reason) {
      report(false);
      return reader.cancel(reason);
    },
  });

  const headers = new Headers({
    "Content-Type": type,
    // s-maxage lets a CDN (e.g. Vercel's) serve repeat views without
    // re-invoking this function or re-fetching from MangaDex@Home.
    "Cache-Control": "public, max-age=86400, s-maxage=604800",
    "X-Content-Type-Options": "nosniff",
  });
  const length = res.headers.get("content-length");
  if (length) headers.set("Content-Length", length);
  return new Response(stream, { headers });
}

export async function GET(_request: Request, ctx: RouteContext<"/api/chapter-image/[chapterId]/[quality]/[page]">) {
  const { chapterId, quality, page } = await ctx.params;
  const index = Number.parseInt(page, 10);

  if (!isUuid(chapterId) || !QUALITIES.has(quality as ImageQuality) || !Number.isInteger(index) || index < 0 || index > 2000) {
    return new Response("Invalid image request", { status: 400 });
  }
  const q = quality as ImageQuality;

  if (await isBlocked(chapterId)) {
    return new Response("This chapter has been removed at the request of its scanlation group", { status: 410 });
  }

  let atHome;
  try {
    atHome = await getAtHome(chapterId);
  } catch {
    return new Response("Chapter images are temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "10" },
    });
  }

  if (index >= pageFiles(atHome, q).length) {
    return new Response("Page not found", { status: 404 });
  }

  let url = buildPageUrl(atHome, q, index);
  if (!url) return new Response("Invalid image metadata", { status: 502 });

  let response = await openPage(url);
  if (!response) {
    // The baseUrl may have expired or the node may be failing: ask MangaDex
    // for fresh delivery data and retry once.
    try {
      atHome = await getAtHome(chapterId, { forceRefresh: true });
      url = buildPageUrl(atHome, q, index);
      if (url) response = await openPage(url);
    } catch {
      // keep the original failure
    }
  }

  return (
    response ??
    new Response("Image could not be loaded", { status: 502, headers: { "Cache-Control": "no-store" } })
  );
}
