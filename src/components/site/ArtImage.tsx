"use client";

import { useState } from "react";

/**
 * A painting served by its museum. If the image ever fails to load, a quiet
 * line and the museum link take its place instead of a broken picture.
 */
export function ArtImage({ src, alt, href, museum }: { src: string; alt: string; href: string; museum: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-fg-subtle hover:text-fg">
        The image didn&apos;t load. See it at the {museum} ↗
      </a>
    );
  return (
    // A plain img: no image-optimisation quota, works on any host.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} decoding="async" className="max-h-[68dvh] w-auto max-w-full object-contain" />
  );
}
