export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return compact.format(n);
}

export function formatRating(n: number | null | undefined): string | null {
  if (n === null || n === undefined || n <= 0) return null;
  return n.toFixed(2);
}

const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Deterministic (UTC) date, safe to render on the server. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

export function formatRelative(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, now - then) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86_400 * 7) return `${Math.floor(diff / 86_400)}d ago`;
  if (diff < 86_400 * 30) return `${Math.floor(diff / (86_400 * 7))}w ago`;
  return formatDate(iso);
}

export function chapterLabel(ch: { number: string | null; title?: string | null; volume?: string | null }): string {
  if (ch.number) return `Chapter ${ch.number}`;
  if (ch.title) return ch.title;
  if (ch.volume) return `Volume ${ch.volume}`;
  return "Oneshot";
}

export function chapterShortLabel(ch: { number: string | null; volume?: string | null }): string {
  if (ch.number) return `Ch. ${ch.number}`;
  if (ch.volume) return `Vol. ${ch.volume}`;
  return "Oneshot";
}

export function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Normalizes a Next.js searchParams value to a single string. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Normalizes a comma-separated or repeated searchParams value to a list. */
export function listParam(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
}

export function pageParam(value: string | string[] | undefined): number {
  const n = Number.parseInt(firstParam(value) ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 400) : 1;
}
