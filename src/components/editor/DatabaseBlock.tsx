"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { Database } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadDatabaseAction } from "@/app/actions/databases";
import { DatabaseView } from "@/components/database/DatabaseView";
import { Spinner } from "@/components/ui/Spinner";
import type { DatabaseData } from "@/lib/databases";

/** A database shown inside a page. Stored as { type: "database", props: { databaseId } }. */
export const createDatabaseBlock = createReactBlockSpec(
  { type: "database", propSchema: { databaseId: { default: "" } }, content: "none" },
  { render: ({ block }) => <InlineDatabase id={block.props.databaseId} /> },
);

function InlineDatabase({ id }: { id: string }) {
  const [data, setData] = useState<DatabaseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    void loadDatabaseAction(id).then((res) => {
      if (!alive) return;
      if (res.ok) setData(res.data);
      else setError("This database was deleted or you can't see it.");
    });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div contentEditable={false} className="w-full select-text" onKeyDown={(e) => e.stopPropagation()}>
      {error ? (
        <p className="rounded-md bg-bg-inset px-3 py-2 text-sm text-fg-muted">{error}</p>
      ) : !data ? (
        <Spinner className="my-3" />
      ) : (
        <>
          <Link
            href={`/w/${data.database.workspaceSlug}/${data.database.id}` as Route}
            className="mb-1 inline-flex items-center gap-1.5 text-lg font-semibold hover:underline"
          >
            {data.database.icon ? <span>{data.database.icon}</span> : <Database className="size-4 text-fg-subtle" />}
            {data.database.title || "Untitled database"}
          </Link>
          <DatabaseView initial={data} inline />
        </>
      )}
    </div>
  );
}
