import "server-only";

import type { MdErrorResponse } from "@/types/mangadex";

/**
 * Low-level MangaDex HTTP client (server only).
 *
 * Compliance notes (https://api.mangadex.org/docs/2-limitations/):
 * - Every request carries an honest, non-spoofed User-Agent.
 * - No `Via` header is ever sent (we are a transparent server-side proxy).
 * - Requests are spaced to stay under the ~5 req/s per-IP global limit.
 * - HTTP 429 responses are retried a bounded number of times after the
 *   advertised retry delay, never in a tight loop (which would escalate to a ban).
 */

export const MANGADEX_API = "https://api.mangadex.org";
export const MANGADEX_UPLOADS = "https://uploads.mangadex.org";
export const MANGADEX_AT_HOME_REPORT = "https://api.mangadex.network/report";

export const USER_AGENT =
  process.env.MANGADEX_USER_AGENT?.trim() ||
  "BeanZz/0.1 (self-hosted manhwa reader; built with Next.js)";

/** Minimum spacing between upstream requests from this server process. */
const MIN_INTERVAL_MS = 230;
const MAX_429_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 15_000;

export class MangaDexError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "MangaDexError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Request spacing. Uses performance.now() (monotonic, and not treated as a
// non-deterministic value by Cache Components prerendering).
// ---------------------------------------------------------------------------
let nextSlot = 0;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function acquireSlot(): Promise<void> {
  const now = performance.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MIN_INTERVAL_MS;
  const wait = slot - now;
  if (wait > 0) await sleep(wait);
}

/**
 * Cooldown shared by all requests after a 429, so concurrent callers back off
 * together instead of each hammering the API.
 */
let cooldownUntil = 0;

async function waitForCooldown() {
  const wait = cooldownUntil - performance.now();
  if (wait > 0) await sleep(wait);
}

function retryDelayMs(res: Response): number {
  const retryIn = Number(res.headers.get("x-ratelimit-retry-in"));
  if (Number.isFinite(retryIn) && retryIn > 0) return Math.min(retryIn * 1000, 10_000);
  const retryAfter = Number(res.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 10_000);
  return 2_000;
}

// ---------------------------------------------------------------------------
// Query building. MangaDex uses PHP-style array params: `includes[]=x`,
// `order[followedCount]=desc`.
// ---------------------------------------------------------------------------
export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number)[]
  | Readonly<Record<string, string>>;

export type Query = Record<string, QueryValue>;

export function buildQuery(params: Query): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(`${key}[]`, String(item));
    } else if (typeof value === "object") {
      for (const [sub, v] of Object.entries(value as Record<string, string>)) {
        search.append(`${key}[${sub}]`, v);
      }
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------
async function performRequest<T>(url: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await waitForCooldown();
    await acquireSlot();

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "network error";
      throw new MangaDexError(503, `Could not reach MangaDex (${reason})`);
    }

    if (res.status === 429) {
      const delay = retryDelayMs(res);
      cooldownUntil = Math.max(cooldownUntil, performance.now() + delay);
      if (attempt < MAX_429_RETRIES) continue;
      throw new MangaDexError(429, "MangaDex rate limit reached. Please try again shortly.");
    }

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = (await res.json()) as MdErrorResponse;
        detail = body.errors?.[0]?.detail || body.errors?.[0]?.title || detail;
      } catch {
        // non-JSON error body
      }
      throw new MangaDexError(res.status, detail || `MangaDex request failed (${res.status})`);
    }

    return (await res.json()) as T;
  }
}

/**
 * GET a JSON resource from the MangaDex API.
 *
 * Request deduplication is intentionally not done here: every caller is a
 * `"use cache"` function, which already dedupes identical calls. A module-level
 * promise map would leak promises across cache scopes, which Cache Components
 * rejects.
 */
export function mdGet<T>(path: string, params: Query = {}): Promise<T> {
  return performRequest<T>(`${MANGADEX_API}${path}${buildQuery(params)}`);
}

/**
 * Fetch a binary resource (images) from a MangaDex host.
 *
 * `headerTimeoutMs` bounds only the wait for response headers. After that,
 * the body is aborted only if it stalls (no bytes for `idleTimeoutMs`): large
 * original-quality pages (5–10 MB) can legitimately take minutes on a slow
 * link, and a total-duration cap would kill transfers that are progressing.
 */
export async function mdFetchBinary(
  url: string,
  { headerTimeoutMs = 15_000, idleTimeoutMs = 30_000 }: { headerTimeoutMs?: number; idleTimeoutMs?: number } = {},
): Promise<Response> {
  await waitForCooldown();
  const controller = new AbortController();
  const headerTimer = setTimeout(() => controller.abort(new DOMException("Header timeout", "TimeoutError")), headerTimeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.body) return res;

    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controller.abort(new DOMException("Body stalled", "TimeoutError")), idleTimeoutMs);
    };
    arm();
    const watchdog = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctrl) {
        arm();
        ctrl.enqueue(chunk);
      },
      flush() {
        clearTimeout(idleTimer);
      },
    });
    return new Response(res.body.pipeThrough(watchdog), {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  } finally {
    clearTimeout(headerTimer);
  }
}
