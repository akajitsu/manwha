import Link from "next/link";

import { NAV_LINKS, SITE } from "@/constants/site";

import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1.6fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{SITE.tagline}.</p>
          <p className="mt-3 text-xs text-subtle">Free and ad-free. Inkmoon does not sell access to any content.</p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[...NAV_LINKS, { href: "/search", label: "Search" }, { href: "/library", label: "My Library" }].map((l) => (
            <Link key={l.href} href={l.href} className="text-muted transition hover:text-accent">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="rounded-xl border border-line bg-bg/60 p-4 text-xs leading-relaxed text-muted">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg">Attribution</h2>
          <p>
            Series information, cover art and chapters are provided by{" "}
            <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
              MangaDex
            </a>{" "}
            through its public API. Inkmoon is an independent reader and is not affiliated with MangaDex.
          </p>
          <p className="mt-2">
            Comics belong to their respective authors and publishers. Fan translations are the work of the scanlation groups
            credited on each chapter and are not official, licensed releases. Official releases are linked where MangaDex lists
            them — please support the creators.
          </p>
          <p className="mt-2">
            Content removal requests from scanlation groups are honored and should also be sent to MangaDex.
          </p>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-subtle">
        © {SITE.name}. Data via the MangaDex API.
      </div>
    </footer>
  );
}
