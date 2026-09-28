import type { Route } from "next";
import type { TileSpan } from "./Tile";
import { Tile } from "./Tile";
import { Mosaic } from "./Mosaic";
import { coverTileTone } from "./CoverArt";
import { HubCover } from "./HubCover";
import { Tag } from "@/components/ui/Label";
import { hubNumber, STAGE_LABEL, type HubCard } from "@/lib/hubs";

/*
 * Portfolio rhythm: a repeating sequence of spans that always fills rows of
 * 12 columns on desktop. The first hub leads big.
 */
const RHYTHM: TileSpan[] = ["hero", "tall", "square", "square", "square", "half", "half", "wide", "square"];

export function HubMosaic({ hubs }: { hubs: HubCard[] }) {
  return (
    <Mosaic>
      {hubs.map((h, i) => (
        <Tile
          key={h.id}
          index={i}
          span={hubs.length === 1 ? "wide" : RHYTHM[i % RHYTHM.length]}
          tone={coverTileTone(h)}
          label={`${hubNumber(h.number)} · ${h.memberRole ? `Team · ${h.memberRole}` : STAGE_LABEL[h.stage]}`}
          title={h.name}
          href={`/hubs/${h.slug}` as Route}
          meta={h.isNew ? <Tag>New</Tag> : undefined}
          media={<HubCover hub={h} />}
        />
      ))}
    </Mosaic>
  );
}
