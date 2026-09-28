/** A one-click feature/unfeature form. A server action does the write; no client JS needed. */
export function FeatureToggle({
  id,
  featured,
  action,
  name,
}: {
  id: string;
  featured: boolean;
  action: (form: FormData) => Promise<void>;
  name: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="featured" value={featured ? "false" : "true"} />
      <button
        type="submit"
        aria-label={featured ? `Unfeature ${name}` : `Feature ${name}`}
        className={`label rounded-xs border px-2.5 py-1.5 whitespace-nowrap transition-colors ${
          featured ? "border-signal bg-signal text-field" : "border-line text-smoke hover:border-bone hover:text-bone"
        }`}
      >
        {featured ? "● Featured" : "Feature"}
      </button>
    </form>
  );
}
