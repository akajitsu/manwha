import Link from "next/link";

import { LogoMark } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <LogoMark className="mb-6 size-12" />
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="mt-2 text-2xl font-extrabold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        This series or chapter doesn&apos;t exist, or it&apos;s no longer available on MangaDex.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-ink hover:bg-accent-strong">
          Go home
        </Link>
        <Link href="/search" className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-fg hover:border-fg/40">
          Search titles
        </Link>
      </div>
    </div>
  );
}
