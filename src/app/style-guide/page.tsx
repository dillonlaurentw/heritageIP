import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MaskedLines } from "@/components/motion/MaskedLines";
import { PageWipe } from "@/components/motion/PageWipe";
import { Reveal } from "@/components/motion/Reveal";
import { CoverArt, coverFor } from "@/components/mosaic/CoverArt";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Tile, type TileSpan } from "@/components/mosaic/Tile";
import { ArrowLink, Button } from "@/components/ui/ArrowLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { Hairline } from "@/components/ui/Hairline";
import { Label, Tag } from "@/components/ui/Label";
import { SignalPicker } from "./SignalPicker";

export const metadata: Metadata = { title: "Style guide · SELF" };

function Section({
  n,
  name,
  children,
  bone = false,
}: {
  n: string;
  name: string;
  children: ReactNode;
  bone?: boolean;
}) {
  return (
    <section className={bone ? "bg-bone text-field" : ""}>
      <div className="px-edge pt-16 pb-6">
        <Hairline onBone={bone} className="mb-4" />
        <Label tone={bone ? "field" : "smoke"}>
          {n} · {name}
        </Label>
      </div>
      <div className="pb-20">{children}</div>
    </section>
  );
}

const colors = [
  { token: "field", hex: "#1F2620", use: "Main background", cls: "bg-field border border-line text-bone" },
  { token: "field-raised", hex: "#262E27", use: "Tile ground", cls: "bg-field-raised text-bone" },
  { token: "bone", hex: "#EDE8DF", use: "Primary text, inverted sections", cls: "bg-bone text-field" },
  { token: "smoke", hex: "#849083", use: "Secondary text, hairlines", cls: "bg-smoke text-field" },
  { token: "signal", hex: "#FF5B1F", use: "Live states, CTAs, NEW. Sparingly.", cls: "bg-signal text-field" },
];

const typeScale = [
  { token: "text-hero", spec: "clamp → 13.5vw · 850 · -0.05em · 0.86", cls: "type-display text-hero", sample: "Build it." },
  { token: "text-display", spec: "clamp → 8vw · 850 · -0.045em · 0.88", cls: "type-display text-display", sample: "Start with a thought." },
  { token: "text-prompt", spec: "clamp → 5.4vw · 850 · -0.045em · 0.9", cls: "type-display text-prompt", sample: "How do you make hard calls?" },
  { token: "text-headline", spec: "clamp → 4.6vw · 850 · -0.04em · 0.92", cls: "type-display text-headline", sample: "Who are you building with?" },
  { token: "text-statement", spec: "clamp → 3.1vw · 850 · -0.035em · 1", cls: "type-display text-statement measure", sample: "Coastal food producers will switch to kelp packaging made on their own coast." },
  { token: "text-title", spec: "clamp → 2.1vw · 850 · -0.03em · 1", cls: "type-display text-title", sample: "Tidewater Kelp" },
  { token: "text-lead", spec: "clamp → 1.375rem · 400 · 1.5", cls: "text-lead measure", sample: "A hub holds one idea: the thesis, the game plan, the team, and every connection it takes to launch." },
  { token: "text-body", spec: "1rem · 400 · 1.6", cls: "text-body measure", sample: "Short lines, generous leading. Body copy stays under sixty characters a line so it reads like a statement, not a manual." },
  { token: "label", spec: "IBM Plex Mono · 0.6875rem · 500 · +0.12em · caps", cls: "label", sample: "Hub 03 · Step 2/9 · Simulation" },
];

const hubs: { name: string; label: string; span: TileSpan; isNew?: boolean }[] = [
  { name: "Tidewater Kelp", label: "Hub 01 · Thesis", span: "hero", isNew: true },
  { name: "Ground Truth", label: "Hub 02 · Step 4/11", span: "tall" },
  { name: "Night Shift Bakery", label: "Hub 03 · Launch", span: "square" },
  { name: "Common Thread", label: "Hub 04 · Team 3", span: "square" },
  { name: "Loam", label: "Hub 05 · Step 2/9", span: "square" },
  { name: "Parallel Clinic", label: "Hub 06 · Thesis", span: "half" },
  { name: "Open Hand Tools", label: "Hub 07 · Step 7/12", span: "half" },
  { name: "Field Notes", label: "Hub 08 · Idea", span: "wide" },
];

const transcript = [
  { who: "Maya · Agent", line: "If we split evenly now, we're pricing the next two years at today's guesses." },
  { who: "Dev · Agent", line: "Vesting handles that. Uneven splits on day one are how resentment starts." },
  { who: "Maya · Agent", line: "Then let's agree what would make us revisit it, and write that down." },
];

export default function StyleGuide() {
  return (
    <PageWipe>
      {/* Hero: one statement, one arrow. */}
      <section className="flex min-h-[calc(100dvh-3.5rem)] flex-col justify-between px-edge pt-10 pb-12">
        <div className="flex justify-between">
          <Label>SELF · Design system · Phase 0</Label>
          <Label>V0.1</Label>
        </div>
        <div>
          <MaskedLines lines={["Brave builders", "change the", "world."]} className="type-display text-hero" />
          <ArrowLink href="#mosaic" size="hero" tone="signal" className="mt-10">
            See the work
          </ArrowLink>
        </div>
      </section>

      <Section n="01" name="Signal · Pick one">
        <div className="px-edge">
          <SignalPicker />
        </div>
      </Section>

      <Section n="02" name="Color tokens">
        <div className="grid grid-cols-2 gap-gutter px-edge md:grid-cols-5">
          {colors.map((c, i) => (
            <Reveal key={c.token} index={i}>
              <div className={`flex h-56 flex-col justify-between rounded-xs p-4 ${c.cls}`}>
                <span className="label">{c.token}</span>
                <span>
                  <span className="type-display block text-title">{c.hex}</span>
                  <span className="label mt-2 block opacity-70">{c.use}</span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 px-edge md:grid-cols-2">
          <div>
            <Label>line · hairline on field</Label>
            <Hairline className="mt-3" />
          </div>
          <div className="bg-bone p-4">
            <Label tone="field">line-bone · hairline on bone</Label>
            <Hairline onBone className="mt-3" />
          </div>
        </div>
      </Section>

      <Section n="03" name="Type · Archivo + IBM Plex Mono">
        <div className="px-edge">
          {typeScale.map((t) => (
            <div key={t.token} className="grid grid-cols-1 gap-3 border-t border-line py-8 md:grid-cols-[16rem_1fr]">
              <div className="flex flex-col gap-1">
                <Label tone="bone">{t.token}</Label>
                <Label>{t.spec}</Label>
              </div>
              <p className={t.cls}>{t.sample}</p>
            </div>
          ))}
          <div className="grid grid-cols-1 gap-3 border-t border-line py-8 md:grid-cols-[16rem_1fr]">
            <div className="flex flex-col gap-1">
              <Label tone="bone">Width axis · hover</Label>
              <Label>wdth 100 → 125, 400ms ease-out</Label>
            </div>
            <p className="type-display text-display transition-[--wdth] duration-(--duration-base) ease-out-strong hover:[--wdth:125]">
              Type that shifts.
            </p>
          </div>
        </div>
      </Section>

      <Section n="04" name="Labels, tags, actions">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-edge">
          <Tag>New</Tag>
          <Label tone="bone">Hub 03</Label>
          <Label>Step 2/9</Label>
          <Label tone="signal">Needs · Co-founder</Label>
          <Label live tone="signal">
            Live
          </Label>
        </div>
        <div className="mt-12 flex flex-col items-start gap-8 px-edge">
          <ArrowLink href="/style-guide" size="hero" tone="signal">
            Create a hub
          </ArrowLink>
          <ArrowLink href="/style-guide" size="lead">
            Request an intro
          </ArrowLink>
          <ArrowLink href="/style-guide" size="inline" className="text-smoke">
            View all partners
          </ArrowLink>
          <div className="flex flex-wrap gap-3">
            <Button>Save thesis</Button>
            <Button variant="ghost">Generate game plan</Button>
          </div>
        </div>
      </Section>

      {/* The work: hubs as a studio portfolio. */}
      <section id="mosaic" className="scroll-mt-14">
        <div className="px-edge pt-16 pb-6">
          <Hairline className="mb-4" />
          <div className="flex items-end justify-between">
            <Label>05 · Tile mosaic</Label>
            <Label>08 hubs</Label>
          </div>
        </div>
        <div className="px-gutter">
          <Mosaic>
            {hubs.slice(0, 5).map((h, i) => (
              <Tile
                key={h.name}
                index={i}
                span={h.span}
                tone={coverFor(h.name).tone}
                label={h.label}
                title={h.name}
                href="/style-guide"
                meta={h.isNew ? <Tag>New</Tag> : undefined}
                media={<CoverArt name={h.name} number={i + 1} />}
              />
            ))}

            {/* Deliberate break: a statement that runs off both edges. */}
            <Reveal className="col-span-12 row-span-2 overflow-hidden">
              <div className="flex h-full items-center">
                <p className="type-display -ml-[2vw] text-[19vw] leading-[0.8] whitespace-nowrap text-signal [--wdth:70]">
                  Brave brands change the world
                </p>
              </div>
            </Reveal>

            {hubs.slice(5).map((h, i) => (
              <Tile
                key={h.name}
                index={i}
                span={h.span}
                tone={coverFor(h.name).tone}
                label={h.label}
                title={h.name}
                href="/style-guide"
                media={<CoverArt name={h.name} number={i + 6} />}
              />
            ))}

            <Tile span="square" tone="field" label="Partner · Legal" title="Harbor & Vine Legal" index={3} />
            <Tile span="square" tone="bone" label="Mentor · Supply chain" title="Ines Okafor" index={4} />
            <Tile span="wide" tone="signal" label="Agent · GTM" title="Draft your positioning" index={5} />
          </Mosaic>
        </div>
      </section>

      {/* Full-bleed Bone section, for rhythm. */}
      <section className="mt-20 bg-bone px-edge py-24 text-field">
        <Label tone="field">06 · Inverted section</Label>
        <MaskedLines
          as="h2"
          onView
          lines={["Nobody builds", "alone."]}
          className="type-display mt-8 text-display"
        />
        <p className="measure mt-8 text-lead">
          Co-founders, suppliers, legal, backers, mentors. SELF connects you to the people who get it built.
        </p>
        <ArrowLink href="/style-guide" tone="field" size="lead" className="mt-10">
          Find your people
        </ArrowLink>
      </section>

      <Section n="07" name="Empty state">
        <div className="border-y border-line">
          <EmptyState line="No hubs yet. Start with a thought." href="/style-guide" />
        </div>
      </Section>

      <Section n="08" name="Control room · Agents + simulations">
        <div className="mx-edge border border-line">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-3">
            <div className="flex flex-wrap items-center gap-6">
              <Label live tone="signal">
                Live
              </Label>
              <Label tone="bone">Simulation</Label>
              <Label>Scenario · Split equity</Label>
            </div>
            <Label tone="bone">Turn 05/12</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_18rem]">
            <ol className="divide-y divide-line">
              {transcript.map((t, i) => (
                <li key={i} className="grid grid-cols-[5.5rem_1fr] gap-4 px-4 py-5 md:grid-cols-[9rem_1fr]">
                  <Label>{t.who}</Label>
                  <p className="text-lead">{t.line}</p>
                </li>
              ))}
            </ol>
            <div className="border-t border-line md:border-t-0 md:border-l">
              {[
                ["Strategy", "Idle", false],
                ["GTM", "Drafting", true],
                ["Operations", "Idle", false],
                ["Fundraising", "Idle", false],
                ["Legal · Not advice", "Idle", false],
              ].map(([name, state, live]) => (
                <div key={name as string} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
                  <Label tone="bone">{name}</Label>
                  <Label live={live as boolean} tone={live ? "signal" : "smoke"}>
                    {state}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-line px-4 py-3">
            <Label>Simulated conversation between AI agents. Not a verdict on any real person.</Label>
          </div>
        </div>
      </Section>
    </PageWipe>
  );
}
