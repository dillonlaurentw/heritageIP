"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";

/** The editor only runs in the browser. */
export const LazyEditor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-24 items-center">
      <Spinner />
    </div>
  ),
});
