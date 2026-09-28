# SELF: build plan

Each phase ends in something you can click through locally at
`http://localhost:3000`. I stop after each phase, tell you how to run it and what
to test, commit, and wait for your go-ahead.

Status: Phases 0–2 done. Awaiting go-ahead for Phase 3.
Decisions made: Signal = hot orange #FF5B1F · Better Auth · Archivo + IBM Plex Mono.

---

## Phase 0: Design foundation
**Build:** Next.js + TypeScript + Tailwind v4 scaffold. `src/design/tokens.css`
(color, type scale, spacing, radii, motion). Archivo + IBM Plex Mono via
`next/font`. Motion primitives: `Reveal` (staggered slide/fade on scroll),
`MaskedLines` (line-by-line masked type), `Wipe` (page transition),
`TileHover` (scale + width-axis type shift). `Mosaic` + `Tile` components with
mixed spans and deliberate grid breaks. Nav shell with wordmark, links, and a
placeholder "Ask SELF anything →". All of it respects reduced motion.
**Click through:** `/style-guide`. Colors, type scale, mono labels, buttons/arrows,
hero statement, a full mosaic with fake hubs, a Bone section, an empty state,
and a control-room agent strip. A toggle previews all 3 Signal color options.
**No database yet.**

## Phase 1: Auth + onboarding
**Build:** Postgres (Docker locally), Prisma, Better Auth (email magic link;
Google optional). `User`, `Profile`, role multi-select. Builder onboarding: one
question per screen, big type, masked reveals, "Back / Continue →". Roughly 6
prompts: what you believe, how you work, what you're building toward, strengths,
gaps, how you like to decide. Partner/Mentor/Backer get a short profile step.
**Click through:** sign up → pick roles → reflective flow → land on an empty
"What are you building? →" home. Edit profile later.
**Seed:** ~12 users across all roles.

## Phase 2: Hubs, idea → core thesis
**Build:** `Hub` + `Thesis`. Create a hub from a raw idea, or "Start from nothing"
(agent generates 3–5 ideas from your profile). The thesis flow is a guided dialogue:
the agent asks sharpening questions, then drafts problem / who / why now /
why you / contrarian belief. Every field is editable; saves are versioned lightly.
Generated type-art covers (deterministic from hub name) + optional image upload
(Vercel Blob). First `src/agents/` module: config, `runAgent()`, `AgentRun` logging,
per-user daily caps.
**Click through:** hub list as a portfolio mosaic → new hub → thesis dialogue →
saved thesis page → edit.
**Seed:** 6–8 hubs with covers and finished theses.

## Phase 3: Game plan
**Build:** `PlanStep` with stage (Validate / Build / Launch …), order, done, and
`needs[]` tags. "Generate game plan" from the thesis; add/edit/reorder/delete steps;
mark done (`STEP 4/11` counters). Each need tag links to its area
(`/hubs/[id]/connect/legal`, etc.). Areas are empty-state stubs until their phase lands.
**Click through:** thesis → generate plan → edit a step → mark done → click a
`LEGAL` tag.

## Phase 4: Co-founders + team
**Build:** `RoleOpening`, `HubMember`, and the shared `Signal` table + state machine
in `src/lib/signals.ts` (the core of Phases 4–7). Builders browse open roles,
send interest with a short note, owner accepts/declines, and acceptance reveals
contacts both ways and adds them to the team. Email on new signal / acceptance.
**Click through:** as user A post a role → as user B signal interest → as A accept
→ both see contacts; B appears on the team. (Seed includes a dev-only
"switch user" menu so you can test both sides without two inboxes.)

## Phase 5: Partner directory
**Build:** `Partner` (org profile; optionally claimed by a Partner user),
categories: Suppliers/Manufacturing, Legal, Website/Build, Marketing, Go-to-Market,
Design, Finance/Accounting, Other. Directory mosaic with category filters, partner
profile pages, "Request intro" from inside a hub tied to a plan step
(`PARTNER_INTRO` signal). Partner users see and answer requests.
**Click through:** plan step `SUPPLIER` → filtered directory → partner → request
intro → as partner, accept → intro revealed on the step.
**Seed:** ~24 realistic but clearly fictional partners.

## Phase 6: Funding (interest only)
**Build:** hub setting "Open to backer discovery" (off by default). Backer view:
browse/filter discoverable hubs by stage, category, and needs; hub teaser page
(thesis + team, **no raise amounts or terms**); "Interested" signal; builder
accepts/declines; contacts revealed. Persistent "Not an offer of securities.
SELF facilitates introductions only." footer on backer surfaces.
**Click through:** as builder enable discovery → as backer filter and signal →
as builder accept → contacts revealed.

## Phase 7: Mentorship
**Build:** mentor profiles with focus areas, mentor directory, "Request mentorship"
from a hub (`MENTOR_REQUEST`), accept → reveal. Reuses Phase 4–6 plumbing, so this
is small.

## Phase 8: Marketing + GTM workspace
**Build:** `GtmWorkspace` per hub: positioning, target customers, channels,
launch plan. Each section is editable, with "Draft with GTM agent" / "Sharpen"
actions that propose a draft you accept or discard (never silent overwrites).
**Click through:** hub → GTM → draft positioning → edit → accept.

## Phase 9: Personal agents + team simulations
**Build:** persona summary generated from onboarding + profile, visible and editable
by the user ("This is how your agent sees you"). Setting: "Let my agent join
simulations" (off by default, revocable). Simulation builder: pick 2–4 opted-in
people (always including you), pick a preset scenario (cut MVP scope, respond to
an investor pass, split equity, handle a missed deadline, pivot or persevere) or
write your own. Runs turn by turn with a hard turn cap, streaming into a
control-room view (`● LIVE · SIMULATION · TURN 05/12`). Output: transcript +
fit report with three sections: Aligned / Clashed / Talk about this. No scores.
"My agent's simulations" page for every participant.
**Click through:** opt in two seed users → run "split equity" → watch turns →
read the report → as the other participant see it listed.
**Seed:** one finished simulation with transcript and report.

## Phase 10: Business-specific hub agents
**Build:** per-hub agent roster: Strategy, GTM, Operations/Suppliers,
Fundraising prep (pitch narrative, investor Q&A drill), Legal explainer (with a
fixed not-legal-advice banner and a link to Legal partners). Each agent is given the
hub's thesis, plan, team, and GTM as context. Chat-style panel per agent; outputs
can be saved into the hub (e.g. "save as plan step"). "Ask SELF anything →"
becomes real here: it routes to the right hub agent.
**Click through:** hub → Agents → ask Fundraising for an investor Q&A drill →
Legal agent refuses to give advice and points to partners.

## Phase 11: Admin
**Build:** `/admin` (ADMIN role only): users, hubs, partners, signals, agent runs
(tokens and cost per user/day). Feature/unfeature hubs and partners (featured
items lead the public mosaics). Basic search and filters. Tables are allowed here
but still use tokens, hairlines, and mono labels.

## After Phase 11
Vercel + Neon deploy walkthrough, env var checklist, Playwright smoke run over
the main flows.

---

## Data model (plain-language version)

- **User / Profile**: one person, one account. Roles are a list, so one person
  can be a builder and a mentor. Profile holds onboarding answers and the
  persona summary their agent uses. Contact details sit in their own fields and
  are only released through an accepted Signal.
- **Hub**: one idea. Owned by one user; team members join through `HubMember`.
- **Thesis / PlanStep / GtmWorkspace**: the hub's thinking, in order.
- **RoleOpening**: "we need a technical co-founder".
- **Partner / MentorProfile**: the people and firms builders connect to.
- **Signal**: the one table for every "can we connect?" request (see CLAUDE.md).
  One table means one accept/decline flow, one contact-reveal rule, and one admin
  view.
- **Agent / AgentThread / AgentMessage**: hub agents and their conversations.
- **Simulation / SimulationParticipant / SimulationTurn / FitReport**: the
  simulation run, who was in it (with consent recorded), what was said, and the
  report.
- **AgentRun**: one row per AI call: who, what for, model, tokens, time. This
  drives cost caps and the admin cost view.
- **Investing seam**: `Hub.discoverable`, `Signal(BACKER_INTEREST)`, and a
  commented-out placeholder in the schema for future `Offering` / `Commitment`
  models that would sit behind a licensed funding-portal or broker-dealer partner.
  Nothing is built, and there are no amount fields.

## AI cost controls
- `src/agents/config.ts`: model per agent (a strong model for thesis, simulations,
  and reports; a fast, cheap model for idea lists and small rewrites),
  `maxTokens` per call, `SIM_MAX_TURNS` (default 12), `SIM_MAX_PARTICIPANTS` (4),
  `DAILY_RUNS_PER_USER` (e.g. 40 calls, 3 simulations).
- Prompt caching on the long, stable parts (hub context, persona) to cut cost.
- Every call is logged to `AgentRun`. Over the cap you get a clear message, not a
  failure.
