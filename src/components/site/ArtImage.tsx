"use client";

import { useState } from "react";

/**
 * A painting served by its museum. If the image fails to load it is tried
 * once more (image hosts sometimes refuse a burst of requests); if it fails
 * again, a quiet line and the museum link take its place instead of a
 * broken picture.
 */
export function ArtImage({ src, alt, href, museum }: { src: string; alt: string; href: string; museum: string }) {
  const [tries, setTries] = useState(0);
  const retry = () => (tries === 0 ? setTimeout(() => setTries(1), 1500) : setTries(2));
  if (tries === 2)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-fg-subtle hover:text-fg">
        The image didn&apos;t load. See it at the {museum} ↗
      </a>
    );
  return (
    // A plain img: no image-optimisation quota, works on any host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={tries}
      src={tries ? `${src}${src.includes("?") ? "&" : "?"}retry=1` : src}
      alt={alt}
      onError={retry}
      decoding="async"
      className="max-h-[68dvh] w-auto max-w-full object-contain"
    />
  );
}
