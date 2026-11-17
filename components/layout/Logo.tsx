import Link from "next/link";

import { SITE } from "@/constants/site";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#17171d" />
      <path
        d="M20.5 7.5a9 9 0 1 0 4 15.9A10.5 10.5 0 0 1 20.5 7.5Z"
        fill="var(--color-accent)"
      />
      <path d="M9 22.5h7" stroke="var(--color-fg)" strokeWidth="2" strokeLinecap="round" opacity=".85" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label={`${SITE.name} home`}>
      <LogoMark />
      <span className="text-[19px] font-extrabold tracking-tight text-fg">
        Bean<span className="text-accent">Zz</span>
      </span>
    </Link>
  );
}
