"use client";

import { useSyncExternalStore } from "react";

import { libraryRepository } from "@/lib/storage/local-library";
import { EMPTY_LIBRARY, type LibraryState } from "@/lib/storage/types";

function getServerSnapshot(): LibraryState {
  return EMPTY_LIBRARY;
}

/**
 * Personal library state. Renders the empty library on the server and during
 * hydration, then the stored data, so there are no hydration mismatches.
 */
export function useLibrary() {
  const state = useSyncExternalStore(libraryRepository.subscribe, libraryRepository.getSnapshot, getServerSnapshot);
  return { ...state, actions: libraryRepository };
}

const noopSubscribe = () => () => {};

/** True once running in the browser after hydration. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
