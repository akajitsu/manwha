import "server-only";

import type { ImageQuality } from "@/types/manga";
import type { MdAtHomeResponse } from "@/types/mangadex";

import { MANGADEX_AT_HOME_REPORT, MangaDexError, USER_AGENT, mdGet } from "./client";

/**
 * MangaDex@Home delivery data for a chapter.
 *
 * `GET /at-home/server/{id}` is limited to 40 requests/minute, and a returned
 * baseUrl is only guaranteed valid for ~15 minutes. We keep entries for 10
 * minutes and allow callers to force a refresh when a node fails, as the docs
 * instruct.
 */
const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 300;
const MIN_FORCED_REFRESH_GAP_MS = 20 * 1000;

interface Entry {
  data: MdAtHomeResponse;
  fetchedAt: number;
}

const cache = new Map<string, Entry>();
const pending = new Map<string, Promise<MdAtHomeResponse>>();

function prune() {
  if (cache.size <= MAX_ENTRIES) return;
  const oldest = [...cache.entries()].sort((a, b) => a[1].fetchedAt - b[1].fetchedAt);
  for (const [key] of oldest.slice(0, cache.size - MAX_ENTRIES)) cache.delete(key);
}

export async function getAtHome(chapterId: string, opts: { forceRefresh?: boolean } = {}): Promise<MdAtHomeResponse> {
  const now = performance.now();
  const hit = cache.get(chapterId);
  if (hit) {
    const age = now - hit.fetchedAt;
    // A forced refresh is ignored if the entry was refreshed very recently, so
    // many failing pages of one chapter can't burn the 40/min at-home budget.
    if (!opts.forceRefresh ? age < TTL_MS : age < MIN_FORCED_REFRESH_GAP_MS) return hit.data;
  }

  const inflight = pending.get(chapterId);
  if (inflight) return inflight;

  const promise = mdGet<MdAtHomeResponse>(`/at-home/server/${chapterId}`)
    .then((data) => {
      if (!data?.baseUrl || !data.chapter?.hash) throw new MangaDexError(502, "Invalid at-home response");
      cache.set(chapterId, { data, fetchedAt: performance.now() });
      prune();
      return data;
    })
    .finally(() => pending.delete(chapterId));
  pending.set(chapterId, promise);
  return promise;
}

export function pageFiles(data: MdAtHomeResponse, quality: ImageQuality): string[] {
  return quality === "data" ? data.chapter.data : data.chapter.dataSaver;
}

const SAFE_FILE_RE = /^[A-Za-z0-9._-]+$/;
const SAFE_HASH_RE = /^[A-Za-z0-9]+$/;

/**
 * Builds the upstream image URL from MangaDex-provided metadata only.
 * The baseUrl must be https and the path components are validated so the
 * proxy can never be pointed at an arbitrary URL.
 */
export function buildPageUrl(data: MdAtHomeResponse, quality: ImageQuality, index: number): string | null {
  const files = pageFiles(data, quality);
  const file = files[index];
  if (!file || !SAFE_FILE_RE.test(file) || !SAFE_HASH_RE.test(data.chapter.hash)) return null;

  let base: URL;
  try {
    base = new URL(data.baseUrl);
  } catch {
    return null;
  }
  if (base.protocol !== "https:") return null;
  const basePath = base.pathname.replace(/\/+$/, "");
  return `${base.origin}${basePath}/${quality}/${data.chapter.hash}/${file}`;
}

/**
 * MangaDex@Home asks clients to report every image retrieval from nodes whose
 * baseUrl is not a mangadex.org host, successful or not.
 */
export async function reportAtHome(report: {
  url: string;
  success: boolean;
  cached: boolean;
  bytes: number;
  duration: number;
}): Promise<void> {
  if (new URL(report.url).hostname.endsWith("mangadex.org")) return;
  try {
    await fetch(MANGADEX_AT_HOME_REPORT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Reporting is best-effort; never fail the reader because of it.
  }
}
