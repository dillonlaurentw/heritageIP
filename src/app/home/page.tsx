import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile } from "@/components/mosaic/Tile";
import { Label } from "@/components/ui/Label";
import { rolesLine } from "@/lib/roles";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Home · SELF" };

export default async function Home() {
  const { user, profile } = await requireOnboarded();
  const first = user.name.split(" ")[0];
  const has = (r: string) => profile.roles.includes(r as never);

  return (
    <PageWipe>
      <section className="flex min-h-[70dvh] flex-col justify-between gap-12 px-edge pt-10 pb-12">
        <div className="flex justify-between">
          <Label>Home · {rolesLine(profile.roles)}</Label>
          <Label>Hubs · 00</Label>
        </div>
        <div>
          <MaskedLines lines={[`${first},`, "what are you", "building?"]} className="type-display text-hero" />
          <div className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="type-display text-headline text-signal">Start a hub →</span>
            <Label>Arrives in Phase 2</Label>
          </div>
        </div>
      </section>

      <div className="px-gutter pb-24">
        <Mosaic>
          <Tile span="wide" tone="bone" label="You" title="How SELF sees you" href="/me" index={0}>
            <p className="measure mt-3 text-body">
              {profile.headline ?? "Your reflection answers, roles and contact details. All editable."}
            </p>
          </Tile>
          <Tile span="square" tone="raised" label="Roles" title={rolesLine(profile.roles)} href="/me" index={1} />
          {has("BACKER") && <Tile span="square" tone="field" label="Backer · Phase 6" title="Discover hubs" index={2} />}
          {has("MENTOR") && <Tile span="square" tone="field" label="Mentor · Phase 7" title="Mentorship requests" index={3} />}
          {has("PARTNER") && <Tile span="square" tone="field" label="Partner · Phase 5" title="Intro requests" index={4} />}
          {has("BUILDER") && <Tile span="square" tone="field" label="Builder · Phase 9" title="Your personal agent" index={5} />}
        </Mosaic>
      </div>
    </PageWipe>
  );
}
