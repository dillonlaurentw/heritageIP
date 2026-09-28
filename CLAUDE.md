# SELF: for the builders of the future

SELF is one place where a person takes an idea all the way to a real company.
Every idea lives in a **Project Hub**. The hub walks a builder from idea → core
thesis → game plan, then connects them to what they need to execute:
co-founders, partners and suppliers, legal help, funding interest, mentorship,
marketing/GTM, and website/build partners. AI agents run through all of it.

SELF does **not** build every service itself. It connects builders to the right
people and partner platforms. Long-term vision: funds inside SELF where people
invest in each other. **That is not built now** (see "Hard rules").

The build plan lives in `docs/PLAN.md`. Build one phase at a time and get
approval before starting the next.

---

## Core object: the Project Hub

A Project Hub is the home for one idea. A user can own many hubs.

```
Hub
 ├─ Thesis           problem · who it's for · why now · why them · contrarian belief
 ├─ Game plan        staged steps, each tagged with needs (COFOUNDER, LEGAL, FUNDING…)
 ├─ Team             owner + accepted members
 ├─ Role openings    roles the builder is looking for
 ├─ Signals          every request/interest in or out of the hub (see below)
 ├─ GTM workspace    positioning · target customers · channels · launch plan
 ├─ Agents           business-specific agents (strategy, GTM, ops, fundraising, legal-explainer)
 └─ Cover            generated type-art or uploaded image
```

Everything else either lives inside a hub or feeds into one.

### The Signal pattern (important)

Almost every "connection" in SELF is the same shape: someone asks, someone
answers, and if the answer is yes, contact info is revealed to both sides.
We model all of these with **one `Signal` table** instead of five lookalike tables:

| Signal kind       | From          | To                  | Accept means                           |
|-------------------|---------------|---------------------|----------------------------------------|
| `ROLE_INTEREST`   | builder       | hub (role opening)  | contacts revealed, added to hub team   |
| `BACKER_INTEREST` | backer        | hub                 | contacts revealed (no money, ever)     |
| `MENTOR_REQUEST`  | hub owner     | mentor              | contacts revealed                      |
| `PARTNER_INTRO`   | hub owner     | partner             | intro email to both sides              |

Status is `PENDING → ACCEPTED | DECLINED | WITHDRAWN`. Signals can point at a
game-plan step (`planStepId`) so "find a supplier" links to the intro it produced.
Contact info is **only** readable through an `ACCEPTED` signal. Enforce this on
the server, never in the UI alone.

---

## Users and roles

One account, many roles: `BUILDER`, `BACKER`, `PARTNER`, `MENTOR`, `ADMIN`.
Builder onboarding is a short, reflective flow (beliefs, how they work, what
they're building toward, strengths, gaps). It should feel like a conversation,
not a form. Those answers power the user's **personal agent**. The user can
always see and edit the persona summary their agent is built from.

---

## Features (build order)

0. Design foundation: tokens, type scale, motion primitives, tile mosaic, style guide
1. Auth + onboarding (multi-role; reflective builder flow)
2. Idea generation → core thesis (AI-guided; also "generate ideas from my profile")
3. Game plan: staged steps, need tags, editable, mark done, tags link to connection areas
4. Co-founders + team: role openings, interest signals, accept → reveal + join team
5. Partner directory: categories, profiles, intro requests tied to plan steps; seeded
6. Funding: backers browse opted-in hubs, send interest; accept → reveal. Nothing else.
7. Mentorship: profiles, request, accept, reveal
8. Marketing + GTM workspace per hub, agent-assisted
9. Personal agents + team simulations (opt-in, transcript + fit report)
10. Business-specific hub agents
11. Admin view: users, hubs, partners, signals; feature hubs/partners

Out of scope: payments, investing, full messaging beyond intro reveals, feeds,
native mobile apps, notifications other than email.

---

## Hard rules (product, legal, trust)

- **No money moves. No investments. No securities offerings.** Funding is interest
  signals and intros only. Do not add raise amounts, valuations, terms, or
  "commit $X" UI to discovery. Seams for regulated investing later are documented
  in `prisma/schema.prisma` comments; build none of it.
- **Simulations are simulations.** Every transcript, report, and agent turn is
  labelled `SIMULATION`. The fit report is a conversation starter, never a score,
  rank, or verdict on a real person. No numeric "fit %".
- **Consent for personal agents.** A person's agent joins a simulation only if
  they have opted in. They can see every simulation their agent took part in, and
  can revoke opt-in at any time.
- **Legal agent is not a lawyer.** It explains concepts and preps questions, says
  plainly that it is not legal advice, and points to a legal partner.
- **Contact info** is revealed only through accepted signals, checked server-side.

---

## Stack

- **Next.js (App Router) + TypeScript**, deployed on Vercel
- **Postgres + Prisma** (Neon in production; local Postgres via Docker for dev)
- **Better Auth** for auth (email magic link + Google). Chosen over Auth.js: it is
  now the actively developed successor (the Auth.js maintainers joined it), has
  first-class Prisma support, typed sessions, and simpler role/extra-field handling.
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Motion** (`motion/react`, the renamed Framer Motion)
- **Anthropic SDK** (`@anthropic-ai/sdk`), server-side only
- **Zod** for input validation, **Resend** for email
- **Vitest** for logic tests; Playwright smoke tests where a flow matters

Keep dependencies minimal. Adding a new runtime dependency needs a reason in the
commit message.

---

## Project layout

```
src/
  app/                  routes (App Router). Server components by default.
    (marketing)/        landing, style guide
    (app)/              signed-in app: hubs, directory, backers, mentors, sims
    admin/              admin view
    api/                only where server actions don't fit (auth, streaming)
  components/
    ui/                 primitives: Button, Label, Hairline, Arrow, Field
    motion/             Reveal, MaskedLines, Wipe, TileHover (all reduced-motion aware)
    mosaic/             Mosaic + Tile
  design/
    tokens.css          THE tokens file (colors, type, spacing, radii, motion)
    motion.ts           shared easings/durations mirrored from tokens
  lib/
    db.ts               Prisma client
    auth.ts             Better Auth config + session helpers
    signals.ts          signal state machine + contact reveal (server-only)
    email.ts
  agents/               ALL AI prompts and logic live here (see below)
prisma/
  schema.prisma
  seed.ts
docs/
  PLAN.md
```

### Agents module (`src/agents/`)

One place to tune every prompt and limit:

```
agents/
  config.ts        model ids, max tokens, turn caps, per-user daily run caps
  client.ts        Anthropic client (server-only), usage logging to AgentRun
  prompts/         one file per agent: thesis, ideas, gamePlan, gtm, strategy,
                   ops, fundraising, legalExplainer, persona, simulation, fitReport
  run.ts           runAgent(): enforces caps, logs tokens, returns typed output
```

- `ANTHROPIC_API_KEY` lives in env vars only. Files in `src/agents/` import
  `server-only` so they can never be bundled for the browser.
- Every call goes through `runAgent()`, which checks caps first and writes an
  `AgentRun` row (user, hub, purpose, model, input/output tokens, duration).
- Prompts are plain template functions that take typed context. No prompt text
  scattered through components.

---

## Design system (strict)

Direction: bold, cinematic brand-studio energy (think DixonBaxi). Confident,
culture-forward, motion-led. A creative studio's site, **not** a SaaS dashboard,
**not** a luxury perfume ad. Attitude: "brave brands change the world."

### Typography
- **Display + UI:** Archivo (variable, wght 100–900, wdth 62–125). Display at
  800–900, letter-spacing -0.03 to -0.05em, line-height ~0.9, hero lines up to
  `clamp(…, 14vw)`. The width axis lets type "shift" on hover without swapping fonts.
- **Body/UI:** same family at 400–500. Short lines (max ~60ch), generous leading.
- **Mono:** IBM Plex Mono, small, UPPERCASE, wide tracking (0.08–0.12em) for labels,
  tags, metadata, counters: `NEW`, `HUB 03`, `STEP 2/9`, `SIMULATION`, `LIVE`.
- Copy is short, human, bold: "What are you building?", "Start with a thought."
  Never corporate.

### Color tokens (only in `src/design/tokens.css`; never hardcode a color)
- `field`  deep green-black, main background (~#1F2620)
- `bone`   warm off-white, primary text + inverted sections
- `signal` ONE saturated accent, **hot orange #FF5B1F** (chosen), used sparingly:
  live states, CTAs, `NEW`
- `smoke`  mid grey-green, secondary text + hairlines
Mostly dark. Full-bleed Bone sections occasionally, for rhythm.

### Layout
- Hero = one giant statement + a single arrow CTA (→). Nothing competes.
- Content lives in an edge-to-edge **tile mosaic** of mixed sizes, tight gutters.
  Tiles are full-bleed media or type with a small mono label and a title.
- Strong grid; break it deliberately for emphasis.
- Hairline dividers. No drop shadows. Radius 0–4px max. No pill buttons.
- Nav: wordmark, a few text links, one persistent "Ask SELF anything →".

### Motion
- Tiles reveal on scroll: staggered slide + fade. Hover: slight scale, media plays
  or type shifts (width axis).
- Big type: line-by-line masked reveal.
- Page transitions: quick, confident wipes.
- 200–600ms, strong ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`). Never floaty.
- `prefers-reduced-motion`: every primitive falls back to an instant or opacity-only
  state. Build this into the primitives, not per-page.
- No heavy WebGL.

### Applied to SELF
- Each hub has a cover tile (generated type-art or uploaded image); the hub list
  reads like a studio portfolio.
- Agents and simulations look like a broadcast control room: mono labels, live
  `signal`-colored states (`● LIVE`, `TURN 04/12`).
- Empty states: one bold line + an arrow. Nothing else.

### Never
Serif display fonts, gold/foil, film grain, glows, gradients, emoji, stock
illustrations, pill buttons, drop shadows, rounded app cards, generic dashboard
widgets (donut charts, KPI cards).

---

## Conventions

- Server components by default; `"use client"` only for interaction/motion.
- Mutations via **server actions** with Zod-validated input and an explicit
  authorization check at the top of every action.
- Prisma is only imported in server code. Never pass full user rows to the
  client; select the fields you need (contact fields especially).
- Names: `PascalCase` components, `camelCase` functions, `SCREAMING_SNAKE` enums.
- Copy lives next to its component; keep it in SELF's voice.
- Seed data (`prisma/seed.ts`) must make every screen look real in a demo. Update it
  in the same phase as any new model.
- One phase = one or more commits with clear messages
  (`phase 3: game plan steps with need tags`). The app must run after every commit.
- If a request is technically unwise, say so and propose an alternative.
- Explain decisions in plain language; the founder is not an engineer by background.

## Running locally

```
npm install                 # also generates the Prisma client
cp .env.example .env        # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d        # local Postgres (or any Postgres; set DATABASE_URL)
npm run db:migrate          # create tables
npm run db:seed             # demo people (re-runnable; resets demo data)
npm run dev                 # http://localhost:3000
npm run lint && npm run typecheck && npm test && npm run build   # before every commit
```

## Auth + data conventions (Phase 1)

- Better Auth tables (`user`, `session`, `account`, `verification`) are about
  login only. Everything about the person lives on `Profile`.
- Prisma 7: client is generated to `src/generated/prisma` (git-ignored) and uses
  the `pg` driver adapter. Import the client only via `src/lib/db.ts`.
- Auth checks happen in pages and actions (`requireViewer`, `requireOnboarded`,
  `requireRole` in `src/lib/session.ts`). There is no middleware.
- Magic-link email goes through Resend when `RESEND_API_KEY` is set; otherwise the
  link is printed to the console and shown on the sign-in page.
- Demo login ("sign in as" seed users, emails `@self.demo`) is always on in dev and
  controlled by `DEMO_LOGIN` elsewhere. It is a plain form POST to
  `/api/demo-login`, not a server action, so the auth redirect is a full navigation.
- `ADMIN_EMAILS` grants the ADMIN role on sign-in. ADMIN is never user-settable.
- Profile writes go through `saveProfileFields()` (Zod-validated,
  `src/lib/profile-schema.ts` is shared with the client).
- Onboarding copy lives in `src/app/onboarding/steps.ts`.

## Hubs + agents conventions (Phase 2)

- Hub access: `getOwnedHub(slug)` in pages, `requireOwnedHubId(id)` in actions
  (`src/lib/hubs.ts`). Non-owners get a 404, never a "forbidden".
- Every model call goes through `runAgent(agent, ctx, { userId, hubId })`
  (`src/agents/run.ts`). It never throws: it returns `{ ok, output, demo }` or
  `{ ok: false, message }` with copy that is safe to show.
- Agents are defined with `defineAgent()`: purpose, effort, Zod output schema,
  `system`/`prompt` template functions, and a `demo()` answer. Structured output
  is enforced by the API (`betaZodOutputFormat`), so no JSON parsing by hand.
- Model is `claude-opus-5` for every agent (`src/agents/config.ts`). Tune cost
  with per-agent `effort` first. Calls opt into the API's server-side fallback
  (`fallbacks: "default"`) so a safety decline is retried on a fallback model.
- No `ANTHROPIC_API_KEY` = demo mode: `demo()` output, logged as `DEMO`, labelled
  "Demo agent" in the UI. Demo runs don't count toward the daily cap.
- Agent conversations are stored as `AgentThread` + `AgentMessage` (with a
  structured `data.type`). Saving a thesis opens a fresh thread.
- Thesis history: every save writes a `ThesisRevision` snapshot.
- Covers: `HubCover` renders the uploaded image or generated `CoverArt`; use
  `coverTileTone(hub)` for the matching tile tone. Uploads go through
  `storeImage()` (`src/lib/storage.ts`).

## Game plan conventions (Phase 3)

- `PlanStep` has a `stage` (VALIDATE, SETUP, BUILD, LAUNCH), a `position`
  within the stage, and `needs: NeedTag[]`.
- Need tags and where they lead live in `src/lib/needs.ts` (`NEEDS`, and
  `LIVE_PHASE`, which marks which connection areas are live). Every tag renders
  through `NeedTag` and links to `/hubs/[slug]/connect/[need]`.
- Ordering is pure logic in `src/lib/plan-order.ts` (sort, normalize, move
  across stages) with unit tests in `src/lib/__tests__`. Server actions write
  only the rows whose stage/position changed.
- Regenerating a plan keeps done steps and replaces everything else.
- Plan actions return the full step list; the client replaces its state with it.
- `npm test` runs Vitest. Add tests for pure logic like this.

## Team + signals conventions (Phase 4)

- Signal transitions live in `src/lib/signal-rules.ts` (pure, unit tested):
  only the recipient accepts/declines, only the sender withdraws, final states
  never change. `actOnSignal()` in `src/lib/signals.ts` applies them with a
  "still pending" guard, runs side effects (ROLE_INTEREST → HubMember), and
  sends emails.
- **Contact details only come from `contactsFor(viewerId, userIds)`.** It
  returns entries only for people who share an ACCEPTED signal with the
  viewer. Never select `contactEmail`/`contactLink` anywhere else for display.
- Hub visibility: `getHubAccess()` lets owners and team members view a hub
  (hub page, plan read-only, team). Edit, thesis and actions stay owner-only.
- Posting a role makes the hub's name, one-liner and thesis statement visible to
  other builders (on `/roles`). Plans, other theses fields and contacts stay private.
- `/connections` is the single inbox for every signal kind; later phases add
  kinds there instead of building new inboxes.
- Dev/demo: the "Demo · Switch" menu (bottom-left) signs in as any seed user.

## Partner conventions (Phase 5)

- `Partner` is a firm profile. `claimedById` links the PARTNER user who manages
  it and answers intros. Unclaimed partners' intros go to SELF's concierge
  (`CONCIERGE_EMAIL`, else the earliest admin), who makes the intro by email.
- `PARTNER_INTRO` signals carry `partnerId` and usually `planStepId`. Accepting
  sends the "intro email to both sides" (`sendIntroEmails`).
- The firm's `contactEmail` is revealed only via `partnerContactsFor()` (an
  accepted intro from one of the viewer's hubs). Person contacts still go
  through `contactsFor()`.
- Needs map to directory categories in `NEED_TO_CATEGORY` (`src/lib/needs.ts`).
  `?hub=&step=` travel through the directory so a request stays tied to a step.
- Claiming a profile is an admin action (Phase 11); partners edit their claimed
  profile at `/partners/[slug]/edit`.
- Magic-link rate limit: 5/min per visitor normally, 60/min in demo mode.

## Funding conventions (Phase 6): interest only

- `Hub.discoverable` is off by default. Opening requires a saved thesis and a
  sector. Only signed-in BACKER (or ADMIN) users can browse `/backers`; the
  teaser at `/backers/[slug]` shows only name, cover, one-liner, stage, sector,
  thesis, team names/roles, plan progress counts and the backer ask.
- A backer with an ACCEPTED signal can still open the teaser after the hub
  hides itself; nobody else can (`canSeeTeaser`).
- `BACKER_INTEREST` signals go backer → hub owner. Accepting swaps contacts via
  the normal `contactsFor()` gate. Nothing else happens.
- `mentionsTerms()` (`src/lib/no-terms.ts`, unit tested) blocks amounts,
  valuations and deal terms in the backer ask, backer notes and the profile's
  backer note. Keep it on every new backer-facing free-text field.
- `<NotAnOffer />` sits at the bottom of every backer surface. It is product
  copy, not legal advice; counsel must review before launch.
- The investing seam is documented at the bottom of `prisma/schema.prisma`.
  Build none of it without a licensed partner.

## Mentorship conventions (Phase 7)

- Mentors are users with the MENTOR role; their profile's `focusAreas`,
  `mentorNote` and `mentorOpen` (pause switch) drive `/mentors`.
- `MENTOR_REQUEST` signals go hub owner → mentor, with `hubId` and optional
  `planStepId`. Accepting swaps contacts through `contactsFor()`.
- `HubRequestForm` (`src/components/connect`) is the shared "pick a hub, pick a
  step, write a note" form used by partner intros and mentor requests.
  `hubOptionsFor()` builds its options.
- The nav has no "Home" link; the wordmark goes home.

## Design primitives (Phase 0)

- `src/design/tokens.css`: colors, type scale, radii, motion. Tailwind's default
  palette/shadows/radii are wiped, so off-token classes don't exist.
- `components/motion`: `Reveal` (scroll stagger), `MaskedLines` (line-by-line
  mask), `PageWipe` (wrap each page.tsx; React `<ViewTransition>`).
- `components/mosaic`: `Mosaic`, `Tile` (spans: hero, wide, half, tall, square,
  quarter, strip), `CoverArt` (deterministic type-art from a hub name).
- `components/ui`: `Label`/`Tag`, `ArrowLink`/`Arrow`/`Button`, `Hairline`, `EmptyState`.
- `.type-display` = heavy display face; `.label` = mono label; `--wdth` animates width.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
