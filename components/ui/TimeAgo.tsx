"use client";

import { useSyncExternalStore } from "react";

import { formatDate, formatRelative } from "@/lib/utils/format";

// A shared minute-resolution clock. The server snapshot is null so the server
// render and hydration both show a deterministic date, then the client switches
// to relative time without a hydration mismatch.
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return now || (now = Date.now());
}

function getServerSnapshot() {
  return null;
}

export function TimeAgo({ date, className }: { date: string; className?: string }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const text = current === null ? formatDate(date) : formatRelative(date, current);
  return (
    <time dateTime={date} title={formatDate(date)} className={className}>
      {text}
    </time>
  );
}
