import { CoverArt, type CoverLayout, type CoverTone } from "./CoverArt";

type CoverFields = {
  name: string;
  number: number;
  coverLayout?: string | null;
  coverTone?: string | null;
  coverImageUrl?: string | null;
};

/** A hub's cover: the uploaded image if there is one, else generated type-art. */
export function HubCover({ hub }: { hub: CoverFields }) {
  if (hub.coverImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- user uploads from arbitrary hosts
    return <img src={hub.coverImageUrl} alt="" className="size-full object-cover" />;
  }
  return (
    <CoverArt
      name={hub.name}
      number={hub.number}
      spec={{
        ...(hub.coverLayout && { layout: hub.coverLayout as CoverLayout }),
        ...(hub.coverTone && { tone: hub.coverTone as CoverTone }),
      }}
    />
  );
}
