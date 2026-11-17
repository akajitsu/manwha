"use client";

import { BookMarked, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { NAV_LINKS } from "@/constants/site";
import { useLibrary } from "@/hooks/useLibrary";
import { cn } from "@/lib/utils/format";

import { SearchBox } from "../search/SearchBox";
import { Logo } from "./Logo";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function LibraryButton({ onClick }: { onClick?: () => void }) {
  const { favorites } = useLibrary();
  return (
    <Link
      href="/library"
      onClick={onClick}
      className="relative grid size-10 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-fg"
      aria-label={`My library${favorites.length ? ` (${favorites.length} saved)` : ""}`}
    >
      <BookMarked className="size-5" />
      {favorites.length > 0 && (
        <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink">
          {favorites.length > 99 ? "99+" : favorites.length}
        </span>
      )}
    </Link>
  );
}

const MOBILE_LINKS = [...NAV_LINKS, { href: "/library", label: "My Library" }, { href: "/search", label: "Search" }];

/**
 * Nav links with active-state highlighting. `usePathname()` is URL data, so
 * this lives in its own component behind <Suspense>; the fallback renders the
 * same links without the active indicator.
 */
function NavLinks({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavLinkList variant={variant} pathname={pathname} onNavigate={onNavigate} />;
}

function NavLinkList({
  variant,
  pathname,
  onNavigate,
}: {
  variant: "desktop" | "mobile";
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const active = (href: string) => pathname !== null && isActive(pathname, href);
  if (variant === "mobile") {
    return (
      <>
        {MOBILE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active(link.href) ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-3 text-base font-medium transition",
              active(link.href) ? "bg-elevated text-accent" : "text-muted hover:bg-elevated hover:text-fg",
            )}
          >
            {link.label}
          </Link>
        ))}
      </>
    );
  }
  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={active(link.href) ? "page" : undefined}
          className={cn(
            "relative rounded-md px-3 py-2 text-sm font-medium transition",
            active(link.href) ? "text-fg" : "text-muted hover:text-fg",
          )}
        >
          {link.label}
          {active(link.href) && (
            <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" aria-hidden />
          )}
        </Link>
      ))}
    </>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Lock page scroll while an overlay is open.
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, searchOpen]);

  const close = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };

  // Note: the overlays below are rendered as siblings of <header>, not
  // children. The header's backdrop-filter makes it the containing block for
  // `position: fixed` descendants, which would trap the overlays inside it.
  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          <Suspense fallback={<NavLinkList variant="desktop" pathname={null} />}>
            <NavLinks variant="desktop" />
          </Suspense>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SearchBox className="hidden w-64 lg:block xl:w-80" />
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="grid size-10 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-fg lg:hidden"
            aria-label="Open search"
          >
            <Search className="size-5" />
          </button>
          <LibraryButton />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid size-10 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-fg md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile / tablet search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Search">
          <div className="container-page flex items-center gap-2 pt-3">
            <SearchBox autoFocus onNavigate={close} className="flex-1" />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:text-fg"
              aria-label="Close search"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 animate-fade-in"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col border-l border-line bg-surface p-4 animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid size-10 place-items-center rounded-lg text-muted hover:text-fg"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              <Suspense
                fallback={<NavLinkList variant="mobile" pathname={null} onNavigate={() => setMenuOpen(false)} />}
              >
                <NavLinks variant="mobile" onNavigate={() => setMenuOpen(false)} />
              </Suspense>
            </nav>
            <p className="mt-auto text-xs leading-relaxed text-subtle">
              Content provided by MangaDex and the scanlation groups credited on each chapter.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
