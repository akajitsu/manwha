import "server-only";

import { connection } from "next/server";

export type LoadResult<T> = { ok: true; data: T } | { ok: false; error: unknown };

/**
 * Runs a data loader for a Server Component section.
 *
 * On failure it calls `connection()` before returning, which defers the
 * section to request time when it happens during prerendering. That keeps a
 * transient MangaDex outage at build/revalidation time from being baked into
 * the static shell; at request time it simply renders the error state.
 */
export async function load<T>(loader: () => Promise<T>): Promise<LoadResult<T>> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    await connection();
    console.error("[beanzz] data load failed:", error instanceof Error ? error.message : error);
    return { ok: false, error };
  }
}
