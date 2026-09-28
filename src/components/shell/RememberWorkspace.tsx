"use client";

import { useEffect } from "react";

/** Remember the last workspace visited, so Home and Network keep its sidebar. */
export function RememberWorkspace({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug.startsWith("private-")) document.cookie = `self-ws=${encodeURIComponent(slug)}; path=/; max-age=31536000; samesite=lax`;
  }, [slug]);
  return null;
}
