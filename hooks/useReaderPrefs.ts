"use client";

import { useSyncExternalStore } from "react";

import type { ImageQuality } from "@/types/manga";

export type ReaderWidth = "fit" | "wide" | "full";

export interface ReaderPrefs {
  quality: ImageQuality;
  width: ReaderWidth;
}

const KEY = "inkmoon:reader:v1";
const listeners = new Set<() => void>();
let cached: ReaderPrefs | null = null;

const SERVER_PREFS: ReaderPrefs = { quality: "data-saver", width: "fit" };

function defaults(): ReaderPrefs {
  // Small screens default to compressed pages to save bandwidth.
  const small = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  return { quality: small ? "data-saver" : "data", width: "fit" };
}

function read(): ReaderPrefs {
  if (cached) return cached;
  let next = defaults();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReaderPrefs>;
      next = {
        quality: parsed.quality === "data" || parsed.quality === "data-saver" ? parsed.quality : next.quality,
        width: parsed.width === "fit" || parsed.width === "wide" || parsed.width === "full" ? parsed.width : next.width,
      };
    }
  } catch {
    // ignore unreadable storage
  }
  cached = next;
  return next;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setReaderPrefs(patch: Partial<ReaderPrefs>) {
  cached = { ...read(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    // storage unavailable; keep in memory
  }
  listeners.forEach((l) => l());
}

export function useReaderPrefs(): ReaderPrefs {
  return useSyncExternalStore(subscribe, read, () => SERVER_PREFS);
}
