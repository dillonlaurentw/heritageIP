import { Label } from "@/components/ui/Label";
import type { Contact } from "@/lib/signals";

export type PersonSummary = {
  name: string;
  headline?: string | null;
  strengths?: string | null;
  buildingToward?: string | null;
};

/** Who someone is, without contact details (those need an accepted signal). */
export function PersonBlurb({ person, compact = false }: { person: PersonSummary; compact?: boolean }) {
  return (
    <div>
      <p className="type-display text-title">{person.name}</p>
      {person.headline && <p className="mt-1 text-body text-smoke">{person.headline}</p>}
      {!compact && (person.strengths || person.buildingToward) && (
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {person.strengths && (
            <div>
              <dt className="label text-smoke">Strongest at</dt>
              <dd className="mt-1 text-small">{person.strengths}</dd>
            </div>
          )}
          {person.buildingToward && (
            <div>
              <dt className="label text-smoke">Building toward</dt>
              <dd className="mt-1 text-small">{person.buildingToward}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

/** Revealed contact, or a note that it appears after connecting. */
export function ContactLine({ contact, tone = "bone" }: { contact?: Contact | null; tone?: "bone" | "field" }) {
  if (!contact) return <Label>Contact shown once you&apos;re connected</Label>;
  const text = tone === "field" ? "text-field" : "text-bone";
  return (
    <div className={`flex flex-col gap-1 ${text}`}>
      <Label tone={tone === "field" ? "field" : "signal"}>Contact · Connected</Label>
      {contact.email && (
        <a href={`mailto:${contact.email}`} className="text-body font-semibold underline decoration-1 underline-offset-4">
          {contact.email}
        </a>
      )}
      {contact.link && (
        <a href={contact.link} target="_blank" rel="noreferrer" className="text-small underline decoration-1 underline-offset-4">
          {contact.link.replace(/^https?:\/\//, "")}
        </a>
      )}
    </div>
  );
}
