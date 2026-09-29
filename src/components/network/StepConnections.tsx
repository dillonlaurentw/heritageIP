import type { Route } from "next";
import Link from "next/link";
import { Tag } from "@/components/ui/Tag";

type Item = { id: string; kind: string; status: string; who: string; href: string; contact: string | null };

const KIND: Record<string, string> = { PARTNER_INTRO: "Intro", MENTOR_REQUEST: "Mentor", ROLE_INTEREST: "Role", BACKER_INTEREST: "Backer" };

/** On a game-plan step: the intros and requests made for it, and where they stand. */
export function StepConnections({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <section className="mb-4 rounded-xl bg-surface shadow-card p-3">
      <p className="mb-1.5 text-xs font-medium text-fg-subtle">Connections for this step</p>
      <ul className="flex flex-col gap-1">
        {items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-2 text-sm">
            <Tag color={i.status === "ACCEPTED" ? "green" : "yellow"}>{i.status === "ACCEPTED" ? "Connected" : "Waiting"}</Tag>
            <span className="text-fg-muted">{KIND[i.kind] ?? i.kind}:</span>
            <Link href={i.href as Route} className="font-medium hover:underline">
              {i.who}
            </Link>
            {i.contact && (
              <a href={`mailto:${i.contact}`} className="text-fg-muted hover:text-fg hover:underline">
                {i.contact}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
