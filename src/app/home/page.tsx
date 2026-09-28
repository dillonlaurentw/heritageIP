import type { Metadata } from "next";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile } from "@/components/mosaic/Tile";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Label } from "@/components/ui/Label";
import { HubMosaic } from "@/components/mosaic/HubMosaic";
import { listHubs } from "@/lib/hubs";
import { db } from "@/lib/db";
import type { Route } from "next";
import { pendingIncoming } from "@/lib/signals";
import { rolesLine } from "@/lib/roles";
import { requireOnboarded } from "@/lib/session";

export const metadata: Metadata = { title: "Home · SELF" };

export default async function Home() {
  const { user, profile } = await requireOnboarded();
  const first = user.name.split(" ")[0];
  const has = (r: string) => profile.roles.includes(r as never);
  const [hubs, waiting, partner] = await Promise.all([
    listHubs(user.id),
    pendingIncoming(user.id),
    db.partner.findUnique({ where: { claimedById: user.id }, select: { name: true, slug: true } }),
  ]);

  return (
    <PageWipe>
      <section className="flex min-h-[70dvh] flex-col justify-between gap-12 px-edge pt-10 pb-12">
        <div className="flex justify-between">
          <Label>Home · {rolesLine(profile.roles)}</Label>
          <Label>Hubs · {String(hubs.length).padStart(2, "0")}</Label>
        </div>
        <div>
          <MaskedLines lines={[`${first},`, "what are you", "building?"]} className="type-display text-hero" />
          <ArrowLink href="/hubs/new" size="hero" tone="signal" className="mt-10">
            {hubs.length ? "Start another hub" : "Start a hub"}
          </ArrowLink>
        </div>
      </section>

      {hubs.length > 0 && (
        <div className="px-gutter pb-gutter">
          <HubMosaic hubs={hubs} />
        </div>
      )}
      <div className="px-gutter pb-24">
        <Mosaic>
          <Tile span="wide" tone="bone" label="You" title="How SELF sees you" href="/me" index={0}>
            <p className="measure mt-3 text-body">
              {profile.headline ?? "Your reflection answers, roles and contact details. All editable."}
            </p>
          </Tile>
          <Tile
            span="square"
            tone={waiting ? "signal" : "raised"}
            label={waiting ? `${waiting} waiting on you` : "Connections"}
            title="Your people"
            href="/connections"
            index={1}
          />
          {has("BUILDER") && <Tile span="square" tone="field" label="Open roles" title="Join a team" href="/roles" index={2} />}
          {has("BACKER") && <Tile span="square" tone="raised" label="Backers · Interest only" title="Discover hubs" href="/backers" index={2} />}
          {has("MENTOR") && <Tile span="square" tone="raised" label="Mentor" title="Your mentor profile" href={`/mentors/${user.id}` as Route} index={3} />}
          {has("PARTNER") && partner && (
            <Tile span="square" tone="raised" label="Your firm" title={partner.name} href={`/partners/${partner.slug}` as Route} index={4} />
          )}
          <Tile span="square" tone="field" label="Legal, supply, build, marketing" title="Find partners" href="/partners" index={3} />
          {has("BUILDER") && <Tile span="square" tone="field" label="People who have done it" title="Find a mentor" href="/mentors" index={4} />}
          <Tile
            span="square"
            tone="field"
            label={profile.simOptIn ? "Personal agent · Opted in" : "Personal agent · Off"}
            title="Rehearse with your team"
            href="/simulations"
            index={5}
          />
        </Mosaic>
      </div>
    </PageWipe>
  );
}
