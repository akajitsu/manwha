"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils/format";

/**
 * Cover artwork served through the /api/cover proxy. MangaDex already provides
 * 256/512px thumbnails, so Next's optimizer is bypassed (`unoptimized`) to
 * avoid re-encoding images twice.
 */
export function CoverImage({
  src,
  alt,
  sizes = "(max-width: 640px) 45vw, 200px",
  priority = false,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src;

  if (failed) {
    return (
      <div className={cn("absolute inset-0 grid place-items-center bg-elevated text-subtle", className)}>
        <ImageOff className="size-6" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailedSrc(src)}
      className={cn("object-cover", className)}
    />
  );
}
