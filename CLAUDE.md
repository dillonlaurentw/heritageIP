# SELF: for the builders of the future

SELF is one workspace for building a company, from the first idea through
running the business and the team. Think Notion, built for founders: pages,
docs and databases, with the path from idea → thesis → game plan built in,
AI agents on every page, and a network for finding co-founders, mentors,
partners (manufacturing, legal, marketing) and backers.

**This is Self3.** Self2 (workspaces, pages, databases, agents, network,
simulations, live co-editing) is the foundation; Self3 re-centres it on the
founder: the ring of people around you (co-founders, partners, advisors,
capital), your Self (the AI version of you), and a quiet, warm design. Self1
(the "Project Hub" version) is saved on the `self1` branch.

SELF does **not** build every service itself. It connects builders to the right
people and partner platforms. Long-term vision: funds inside SELF where people
invest in each other. **That is not built now** (see "Hard rules").

The build plan lives in `docs/PLAN.md` (Self3 phases first). Build one phase at
a time and get approval before starting the next, unless the founder asks for
the full build.

---

## Core objects

```
User ── personal space (private pages, persona, simulations)
Workspace            one company or idea. Replaces Self1's Hub. A user can be in many.
 ├─ Members          OWNER · ADMIN · MEMBER · GUEST
 ├─ Pages            nested tree; each page is a block document (BlockNote JSON)
 │   └─ templates    Thesis, Game plan, Go-to-market, Meeting notes, Hiring…
 ├─ Databases        a page whose rows are pages with typed properties
 │   └─ views        table · board · list · calendar, with filters and sorts
 │   └─ built-ins    Game plan (stage, need tags), Tasks, Roles, Meetings,
 │                   Goals, Customers & suppliers
 ├─ Signals          network requests in or out (see below)
 └─ Agents           AI on any page + named workspace agents
```

- A database row **is** a page: it has properties and can be opened and written in.
- Need tags on game-plan rows (COFOUNDER, LEGAL, SUPPLIER, MARKETING, FUNDING…)
  still lead to the matching part of the network.
- Page content is stored as JSON blocks, so live co-editing (Yjs) can be added
  later without changing how pages are stored.

### The Signal pattern (important)

Almost every "connection" in SELF is the same shape: someone asks, someone
answers, and if the answer is yes, contact info is revealed to both sides.
We model all of these with **one `Signal` table** instead of five lookalike tables:

| Signal kind       | From          | To                  | Accept means                           |
|-------------------|---------------|---------------------|----------------------------------------|
| `ROLE_INTEREST`   | builder       | workspace (role)    | contacts revealed, added to workspace  |
| `BACKER_INTEREST` | backer        | workspace           | contacts revealed (no money, ever)     |
| `MENTOR_REQUEST`  | workspace owner | mentor            | contacts revealed                      |
| `PARTNER_INTRO`   | workspace owner | partner           | intro email to both sides              |
| `ROLE_INVITE`     | workspace member | builder open to matches | contacts revealed, conversation opens |

Status is `PENDING → ACCEPTED | DECLINED | WITHDRAWN`. Signals can point at a
page or database row (e.g. a game-plan step) so "find a supplier" links to the
intro it produced.
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
- **Running a business is fine; investing is not.** Workspaces may track budgets,
  customers and suppliers as data. Nothing in SELF moves money, takes payments,
  or offers securities.

---

## Stack

- **Next.js (App Router) + TypeScript**, deployed on Vercel
- **Postgres + Prisma** (Neon in production and for local dev; Docker optional)
- **Better Auth** for auth (email magic link + Google)
- **BlockNote** (`@blocknote/*`, MPL-2.0) for the page editor, on Tiptap/ProseMirror.
  Do not use `@blocknote/xl-*` packages (GPL or paid); SELF has its own agents.
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Anthropic SDK** (`@anthropic-ai/sdk`), server-side only
- **Zod** for input validation, **Resend** for email
- **Vitest** for logic tests; Playwright smoke tests where a flow matters
- **Yjs** (`yjs`, `y-prosemirror`, `y-protocols`; MIT) for live co-editing and
  presence, synced through SELF's own API and Postgres (no hosted service)

Keep dependencies minimal. Adding a new runtime dependency needs a reason in the
commit message.

---

## Project layout

```
src/
  app/
    (marketing)/        landing, sign-in
    (app)/              signed-in shell: sidebar + pages
      w/[workspace]/    a workspace: pages, databases, settings, members
      me/               personal space, persona, simulations
      network/          people, roles, mentors, partners, backers, connections
    admin/
    api/                only where server actions don't fit (auth, streaming)
  components/
    ui/                 primitives: Button, Input, Menu, Dialog, Tooltip, Tag…
    shell/              Sidebar, PageTree, Breadcrumbs, CommandPalette
    editor/             BlockNote setup, custom blocks (need tag, AI, embeds)
    database/           Table, Board, List, Calendar views, property editors
  design/tokens.css     THE tokens file
  lib/                  server logic (db, auth, session, signals, pages, databases…)
  agents/               ALL AI prompts and logic live here (see below)
prisma/  schema.prisma · seed.ts
docs/    PLAN.md
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

## Design system: quiet and warm (Self3)

Direction: in the spirit of Jony Ive. Few elements, generous space, soft
depth, nothing that shouts. Content leads; chrome is quiet. The prototype
(claude.ai/artifact/YVGqq9CK1tV5Cj3VpG9pLZ) is the reference for every screen.

### The ring
- The signature: you in the middle, four arcs around you: **Co-founders**
  (top-left), **Partners** (top-right), **Advisors** (bottom-right),
  **Capital** (bottom-left). Layout rules are pure in `src/lib/ring.ts`;
  draw it only with `<Ring>` (`src/components/ring/Ring.tsx`).
- People are round (ink `Avatar`), firms are soft squares, agents are soft
  squares with a mono mark (`AgentMark`), open chairs are dashed orange circles.
- A dark stretch of arc means "working together"; grey means pending.

### Typography
- **Geist** for everything: UI 13–15px, body 15–17px with 1.55–1.6 line height,
  page titles 44px at 500 with tight tracking. Max ~72ch for writing.
- **Geist Mono**, small, only for agent marks, IDs, counts and SIMULATION labels.
- The wordmark is `SELF`, 600, letter-spacing 0.18em.
- Copy stays short and human ("What are you building?"). Never corporate.

### Color (tokens only, in `src/design/tokens.css`; never hardcode)
- Warm paper background (`bg`), white cards (`surface`), ink text (`fg`),
  greys for secondary text. Light and dark, following the system, with a toggle.
- **Actions are black pills** (`bg-primary`). Checked boxes, progress and
  switches are ink too.
- **Orange (`accent`, #E4521B) means "needs you"**: open chairs, unread counts,
  the dot at the centre, focus rings. Never large fills, never decoration.
- Semantic colors muted; soft tag colors only for database select options.

### Layout and shape
- Cards: `Card` (`src/components/ui/Card.tsx`), white on paper, radius 20px,
  soft small shadow. The one big sheet on a screen (a question, a thesis) uses
  `lift` (radius 28px, long soft shadow).
- Buttons are pills (`Button`): primary black, secondary white with a hairline.
- App shell: quiet left sidebar on the same paper (wordmark, company switcher,
  You, Inbox, Network…, page tree); the active item is a white pill.
- Matches and fits are explained in words, never scored. Unknown numbers are
  placeholders (`[TIMELINE]`), never invented.
- Keyboard first: ⌘K command palette, `/` block menu.

### Motion
- Quick and quiet: 120–200ms ease-out. No scroll reveals, no page wipes.
- `prefers-reduced-motion`: instant.

### Never
Gradients, glows, emoji as decoration, stock illustrations, heavy shadows,
orange fills, KPI cards or donut charts, scores or percentages about people.

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

## Self2 conventions (by area)

### Workspaces, pages, databases (Phases 1–3)
- Access: `getWorkspaceAccess(slug)` / `getPageAccess()` in pages (non-members get a
  404), `requireWorkspaceRole(id, viewer, "MEMBER")` in actions. Role rules are pure
  and tested in `src/lib/workspace-rules.ts` (OWNER > ADMIN > MEMBER > GUEST;
  guests read only).
- Every page body is BlockNote JSON; `blocksToText()` fills `Page.text` for search.
  Build seed/agent content with the `B` builders in `src/lib/blocks.ts`.
- Databases are Pages (`kind: DATABASE`) with a `schema`; rows are Pages
  (`kind: ROW`) with `props` keyed by property id. View logic (filter, sort,
  group) is pure in `src/lib/db-schema.ts`.
- Built-in databases (Tasks, Game plan, Roles, Meetings, Goals, CRM) are defined
  once in `src/lib/system-dbs.ts` with fixed property ids and found by
  `systemKey`. Create them with `ensureSystemDb()`, never by hand.
- Seed code must not import `server-only` modules; keep shared logic in pure files.

### Idea → thesis → game plan (Phase 4)
- The thesis is an ordinary page with `systemKey: "thesis"`. Its sections are
  read back from the blocks (`thesisFromBlocks`, `src/lib/thesis-doc.ts`), so
  edits made on the page count. Saving from the studio snapshots a PageVersion.
- The game plan is the `gamePlan` system database. Steps SELF added carry
  `template: "ai-step"`; a new plan archives those that aren't done and keeps
  done steps and steps people wrote.
- `/w/[ws]/thesis` and `/w/[ws]/plan` propose; nothing is written until
  "Use this" / "Add N steps". Need tags on a step link out via `needHref()`.
- Templates live in `src/lib/templates.ts` (flows, pages, databases).

### AI on every page (Phase 5)
- "Ask AI" (top bar, selection toolbar, `/ask` slash item, ⌘J) opens
  `AskAIPanel`. `askPage()` proposes Markdown or tasks and saves nothing; the
  editor inserts/replaces blocks only when the person clicks, and
  `addTasksFromPage()` writes Tasks rows linked back to the page.
- Workspace agents (strategy, gtm, marketing, sales, product, legal, fundraising,
  hiring, ops): roster and keyword
  routing in `src/lib/workspace-agents.ts`, prompts in
  `src/agents/prompts/workspaceAgents.ts`, context from `workspaceBriefing()`
  (`src/agents/briefing.ts`, cached in the system prompt). Threads are per user,
  per workspace, per agent (`AgentThread.kind = "agent:<key>"`).
- Suggested tasks/steps are added only via "Add to Tasks" / "Add to game plan".
  Accepted steps are the person's own (no `ai-step` template).
- The legal explainer shows a fixed "Not legal advice" banner linking to Legal
  partners, and the server appends `LEGAL_DISCLAIMER` if a reply lacks it.
  Fundraising prep never drafts offering documents or suggests amounts/terms.
- Guests read; only MEMBER and above can call agents (they cost money).
- `/ask` (and ⌘K "Ask SELF") routes with `routerAgent` and opens the agent with the question.

### Team and company operations (Phase 6)
- Pure rules in `src/lib/ops-rules.ts` (tested): `actionItems()` (unchecked
  to-dos + @mentions), `itemsToSend()` (dedupe against the meeting's tasks),
  `goalProgress()`, `summarizeWeek()`. Server side in `src/lib/ops.ts`.
- Meetings: new rows start from `SYSTEM_DBS.meetings.rowTemplate`. "Send to
  Tasks" creates Tasks rows linked via `meeting`; @mentions become assignees
  (members only). Sending twice never duplicates.
- Goals: progress = linked tasks done / total (Tasks → Goal relation). It is
  computed on read (`loadDatabase().rollups`), never stored.
- Hiring: Roles database (posted ones go to the Network in Phase 7) and a
  Candidates database linked to Roles.
- `/w/[ws]/week` summarises the week from Activity and the built-in databases;
  "Save as a page" writes an ordinary editable page. No KPI cards.
- Add new system databases in `system-dbs.ts` + a `database` template in
  `templates.ts`; the home page's "Run the company" tiles read from there.

### The network (Phase 7)
- Everything lives in `src/lib/network.ts`; routes under `/network` (roles,
  mentors, partners, backers, funding, connections) and `/w/[ws]/backers`.
- **Contact details only come from `contactsFor()` / `partnerContactsFor()`**,
  across an ACCEPTED signal. Never select `contactEmail`/`contactLink` elsewhere.
- Signals carry `workspaceId` and `pageId`: the role row (ROLE_INTEREST) or the
  game-plan step (intros, mentor asks). `stepSignals()` shows them on the step.
- Requests are sent on behalf of a company by its MEMBERs and above
  (`actingFor`). Workspace owners answer role and backer interest.
- Role interest creates a Candidates row (`props.signalId`); answering moves it
  to Talking/Passed. **Accepting never adds anyone to a workspace**; "Add to
  <company>" in Connections is a separate, explicit owner/admin action.
- Posted roles expose only name, one-liner, thesis statement and the role.
- Backers: `discoverable` needs a thesis and a sector; the teaser shows only
  what the teaser page lists. `mentionsTerms()` guards every backer-facing
  field; `<NotAnOffer />` sits on every backer surface.
- Every signal writes a Notification for the recipient (and one when answered).

### Personal agents and simulations (Phase 8)
- `/me/agent` shows exactly `personaText()` (saved persona, else a plain
  restatement of the person's answers). "Rebuild" is a proposal; only Save or
  "Use this" writes. Opt-in is off by default and revocable there.
- `src/lib/simulations.ts`: `eligiblePeople()` = teammates in shared TEAM
  workspaces, candidates who signalled interest in the viewer's roles, and
  accepted connections. Rules stay pure in `simulation-rules.ts`.
- Each simulation freezes `personaSnapshot` + `consentAt` per participant and
  may carry a `workspaceId` (the agents see its name and thesis statement).
- Consent is re-checked every turn; any opt-out cancels (no report). Only
  participants can open a simulation; others get a SIMULATION notification and
  an email when it finishes. No scores, ranks or verdicts anywhere.
- Routes: `/me/agent`, `/simulations`, `/simulations/new`, `/simulations/[id]`
  (also in the user menu).

### Comments, mentions and notifications (Phase 9)
- `notifyUsers()` (`src/lib/notify.ts`) is the one way to notify: inbox row,
  optional email, never the actor, and for workspace things only current
  members. Email only for mentions, requests and accepted intros.
- Comments (`src/lib/comments.ts`): threads on a page or anchored to a block
  (`blockId` + `quote`); replies one level deep; resolve/reopen; delete by the
  author or an admin. Guests can read and comment.
- `CommentsPanel` is a side sheet; "Comment" sits in the selection toolbar next
  to "Ask AI". `?comment=<threadId>` opens the sheet on that thread and flashes
  the block with an overlay (never mutate the editor's DOM).
- @mentions: people (mention inline content; `notifyMentions` after save) and
  pages (inserted as a link). Comment mentions are `@Full Name` in the text.
- Setting a person property on a row notifies the people newly added (ASSIGNED).
- `/inbox` lists notifications with filters; the sidebar shows the unread count.

### Admin (Phase 10)
- `/admin` (overview, people, workspaces, partners, signals, AI usage), guarded
  by `requireAdmin()` (`src/lib/admin.ts`): non-admins get a 404.
- Admins see names, counts and signal notes, never page content or contact
  details. People shows login emails (admins only).
- Featuring (workspaces, partners) orders the public lists. Linking a PARTNER
  user to a firm moves waiting intros to them; unlinking returns them to the
  concierge (`setPartnerManager`).
- AI usage: estimates from `src/lib/agent-cost.ts` by day, person, agent and
  company, plus capped/declined/failed runs. Bars, not KPI cards.

### Live co-editing (Phase 11)
- Yjs over HTTP, stored in Postgres: `PageUpdate` rows per page and epoch,
  `PagePresence` for who's here. Server: `src/lib/collab.ts` + the route
  handler `/api/collab/[pageId]` (GET pull, POST push/seed/compact/leave).
  Client: `HttpProvider` + `connect()` in `src/components/editor/collab.ts`,
  mounted by `CollabEditor`.
- The first editor to open a page seeds the shared doc from `Page.content`
  (one winner via `collabSeeded`). `Page.content` stays the JSON snapshot that
  search, agents, versions and everything else read; each editor saves only its
  own local changes.
- **Any server-side rewrite of an existing page's `content` must call
  `resetCollab(pageId)`** (restore version, saving the thesis). It bumps the
  epoch; open editors reload onto the new content.
- Guests get a live read-only view; only MEMBER+ can push updates.
- Polling is adaptive (1s with others present or recent edits, 4s alone, 15s
  in a hidden tab). Old updates are compacted into one state every ~150.

## Self3 conventions (by phase)

### The ring (Self3 phase 2)
- A company's ring comes from `loadRing(workspace, viewerId)` (`src/lib/ring-data.ts`,
  server-only), which feeds plain data to `buildRing()` (`src/lib/ring-build.ts`,
  pure, tested). Rules: members except the viewer (GUEST → advisors, else
  co-founders); accepted/pending PARTNER_INTRO, MENTOR_REQUEST, BACKER_INTEREST
  and pending ROLE_INTEREST signals; open roles; one open chair per need on
  unfinished plan steps nobody has been asked about yet (`NEED_THEME`,
  `NEED_CHAIR` in `src/lib/needs.ts`). The strongest state wins per person.
- Callers check workspace access before `loadRing`. The ring shows names and
  one-line notes only; never contact details.
- At most two open chairs per arc are drawn (orange means "needs you"); the
  rest are counted in the quarter's label.
- `/home` ("You") shows the ring for `?ws=` or the last company, plus
  `needsYou()` (`src/lib/needs-you.ts`): requests waiting on you, the next step
  on the path (thesis, plan), and open chairs.

### Your Self (Self3 phase 3)
- Your Self is `Profile.selfDoc`: short lines in seven facets (believe, why,
  decide, energy, strengths and gaps, non-negotiables, building toward), each
  with a source, plus "Is this you?" suggestions. Shape and all rules are pure
  in `src/lib/self-doc.ts` (tested); server code in `src/lib/self.ts`.
- Until someone first changes it, their Self is built from their onboarding
  answers on the fly (`selfOf`). Every change goes through `applySelfOp`.
- **The agent is given exactly the approved lines** (`renderPersona`), used by
  `personaText()` for rehearsals and by `builderContext()` for every agent.
  Pending or rejected suggestions are never shown to any agent.
- Suggestions come from `selfSuggestAgent`, grounded only in evidence from
  SELF (thesis fields, thesis answers); nothing sensitive, no labels, max three
  pending, and answered ones never come back.
- `/me/self` is the page; `/me/agent` redirects there. Opt-in for rehearsals
  (`simOptIn`) is on that page and stays off by default.

### Idea → questions → thesis → plan (Self3 phase 4)
- One flow with a `FlowSteps` indicator (`src/components/flow/FlowSteps.tsx`):
  `/new` (the idea, then a working name) → `/w/[ws]/thesis` (questions one at a
  time, then the draft) → `/w/[ws]/plan` (build-out) → the company home (ring).
- The backend is Self2's: question rounds of three (`askQuestions`), one draft
  (`draftThesis`), `saveThesis` only on "Use this and plan it", `acceptPlan`
  only on "Use this plan". The client walks a round one question at a time;
  "Skip" leaves an answer empty, "I don't know yet" says so.
- The draft's `openQuestions` show as "Still unproven". Draft fields are edited
  in place (`Bare` textareas); nothing is written before "Use this".
- Plan build-out: step chips read as ring themes (`needChip()`), and a small
  ring previews the open chairs the kept steps would create (`buildRing` on
  the client over `loadRing(..., { planChairs: false })`).

### Matches and messages (Self3 phase 5)
- Matching is opt-in: `Profile.openToMatches` (off by default, switch on
  `/me/self`). Founders then see only name, headline, location, strengths,
  building toward and `openToMatchesNote`. Advisor chairs use mentors who are
  taking requests. Candidates and chairs: `src/lib/matches.ts`.
- `/w/[ws]/matches?chair=role:<id>|need:COFOUNDER|need:MENTOR&who=<userId>`.
  Open chairs on the ring link here. Order uses `orderForChair()` (word
  overlap, tested) for ORDER ONLY; nothing numeric is ever shown.
- Explanations come from `matchAgent` (grounded in what both people wrote, no
  scores, nothing personal) and are cached in `MatchNote` per company, person
  and chair; "Explain again" replaces the cache.
- "Start a conversation" sends a `ROLE_INVITE` signal (members of the company
  only, to people open to matches, one live invite per person). Accepting it
  swaps contacts like every signal and opens a conversation seeded with the
  note (`conversationFromYes`).
- Messages (`src/lib/messages.ts`, rules in `message-rules.ts`, tested): one
  `Conversation` per pair (`pairKey`), allowed only with a shared TEAM
  workspace or an ACCEPTED signal (`mayMessage`, re-checked on every send).
  The thread polls every 4s while visible. No inbox notification per message;
  the sidebar shows unread conversations.
- A trial week is a `TRIAL_PROPOSAL` message from an owner/admin to someone not
  in the company. Accepting adds them as MEMBER titled "Trial week: …"
  (proposal + consent); answers are guarded to happen once. No money or terms.

### Help by area (Self3 phase 6)
- Eight areas (`src/lib/areas.ts`, pure): go-to-market, marketing & brand,
  sales, product, legal, fundraising prep, hiring & team, operations & budget.
  Each names its agent, the plan needs it covers, partner categories, mentor
  focus areas, team title words and its sections.
- An area's working page is an ordinary page with `systemKey: "area:<key>"`:
  an H2 per section. `readSections` / `writeSection` (`src/lib/area-doc.ts`,
  tested) read and replace one section, keeping everything else, so edits
  made on the page count.
- `areaSectionAgent` drafts or sharpens one section (a proposal). Only "Use
  this" or "Save" writes (`saveAreaSection`: version snapshot + `resetCollab`).
  Legal stays "not legal advice"; fundraising stays prep only; no invented
  numbers (placeholders like [PRICE]).
- `/w/[ws]/areas` (cards; only the area with the most steps nobody has been
  asked about is flagged "Needs you") and `/w/[ws]/areas/[area]` (sections,
  team on this, partners and advisors, plan steps, agent starters).

### What-ifs and rehearsals (Self3 phase 7)
- `/w/[ws]/what-if`: `whatIfAgent` checks a scenario against the unfinished
  plan steps (numbered in the prompt, resolved back with `resolveSlips`). It
  returns what slips, which ring quarters it touches (drawn with
  `<Ring highlight>`), money in words only (placeholders, never figures) and up
  to four suggested steps. Checks are stored as `AgentThread(kind "whatif")`
  messages so the team can see them; nothing changes in the plan until
  someone adds changes (`applyWhatIfChanges`, each change once,
  `changesToApply` tested). Ideas to start from: `whatIfIdeas()` (pure).
- Rehearsals are the Phase 8 simulations with Self3 words: "Maya's Self",
  SIMULATION in mono on every surface, "Rehearsals" in the menu. After the
  notes, "Take it to <name>" opens Messages. `/simulations/new?with=<id>`
  preselects someone (only if eligible and opted in).

### Capital, backers, partners and phone (Self3 phase 8)
- `/home` has hats: founders see their ring; `BackerHome` (companies you
  follow, companies open to backers) and `PartnerHome` (intros waiting, founders
  you work with) live in `home/OtherHomes.tsx`. `?as=founder|backer|partner`
  switches when someone has more than one role.
- The company page backers see (`/network/backers/[slug]`) shows only what the
  teaser rules allow, plus a team-only ring and plan progress counts. The
  "Investing through a licensed partner" card says plainly that it's not
  available; nothing about investing is built. `<NotAnOffer />` stays.
- Phones: rings render smaller without quarter labels below `sm`
  (`labels={false}`); every main screen stacks to one column.

## The SELF app (journal, circles, mentors, network)

The current focus (see `docs/PLAN.md`): a native app in `mobile/` (Expo SDK 57,
Expo Router). Start exclusive, by commitment and fit, never price or pedigree.

- **Access.** `Profile.access` is NONE → APPLIED → MEMBER. Get in with a
  member's invite code (`redeemInvite`, each code once) or by applying with two
  answers (`applyForAccess`), approved at `/admin/applications`
  (`reviewApplication`, answered once). `admit()` sets MEMBER and tops up three
  invite codes. Existing web users were migrated to MEMBER.
- **The journal (home tab).** Talk or type; `journalAgent` answers with at most
  one question. **Private**: `JournalMessage` rows are read only by their owner
  (`src/lib/app/journal.ts`, every query scoped to the viewer). No admin screen,
  person or other agent reads them; the journal agent sees only that person's
  journal and approved Self lines. "Share with my circle" copies one of your own
  entries into the circle chat, once (claimed atomically); delete is for good.
  Voice uses the phone's speech recognition (`expo-speech-recognition`,
  on-device when supported) via `mobile/src/lib/voice.ts`; without the native
  module the app falls back to typing.
- **Circles.** Matched small groups that work like a quiet group chat
  (`CircleMessage`). Onboarding asks field and stage (`FIELDS`, `STAGES` in
  `src/lib/app-rules.ts`); `placeInCircle` runs after onboarding and uses
  `circleFor` (same field and stage, else same field, fullest first, max six;
  tested). Circles are named after what members share (`circleName`). SELF posts
  one optional prompt a week (`authorId` null, unique per circle and week).
  "Catch me up" (`catchUp`, `circleSummaryAgent`) needs three messages this
  week, never ranks or judges, and only suggests who could help whom.
- **Mentors.** No slots or fixed lengths. You ask with a note
  (`askMentor`, `mentorAskProblem`); it's an ordinary `MENTOR_REQUEST` signal
  (workspace optional). The mentor answers on `/requests`; `actOnSignal`
  accepting a MENTOR_REQUEST (or ROLE_INVITE) opens a conversation seeded with
  the note. Contact details still move only through the accepted signal.
- **API.** `/api/m/*` route handlers return JSON; every one starts with
  `appViewer()` (`src/lib/app/http.ts`; `member: true` for members-only).
  Server logic lives in `src/lib/app/*`, pure rules in `src/lib/app-rules.ts`
  (tested). Sign-in is a 6-digit email code (Better Auth `emailOTP`) traded for
  a bearer token (`bearer` plugin). `/api/m/demo-login` works only with demo
  login on.
- **The app.** Screens in `mobile/src/app` (gate in `lib/session.tsx`:
  welcome → access → waiting → onboarding → tabs: Journal, Circle, Mentors,
  Messages, You). Tokens and primitives in `mobile/src/lib/theme.ts` and
  `mobile/src/components/ui.tsx` mirror the web design; the ring lives on You;
  `mobile/src/lib/ring.ts` is a copy of `src/lib/ring.ts` (keep them in step).
  Token in SecureStore (localStorage on web).
- **Web preview.** `cd mobile && npm run export:web` writes `public/app`,
  served at `/app` by a rewrite in `next.config.ts`. `mobile/` and
  `public/app` are excluded from the web app's lint and typecheck; run
  `npx tsc --noEmit` in `mobile/` for the app.
- **Network tab** (`mobile/src/app/(tabs)/network.tsx`): Opportunities,
  Mentors, Co-founders, Partners, Capital. Every request has the same shape
  (`AskInline`: write a note, send); every answer lands on `/requests`
  (`incomingRequests` / `answerRequest` in `src/lib/app/mentors.ts`). A yes on
  MENTOR_REQUEST, ROLE_INVITE, BACKER_INTEREST, or a PARTNER_INTRO answered by
  the firm itself, opens a conversation (`actOnSignal`); concierge intros stay
  email intros.
- **Opportunities** (`src/lib/app/opportunities.ts`; rules `opportunityFit`,
  `fitSentence`, `requestProblem`, `pickProblem`, `opportunityProblem`,
  `mayHost`, tested). Hosts: MENTOR, PARTNER, BACKER or ADMIN. Members see only
  what fits them (field, stage, `buildingOnly` = journal or circle activity in
  14 days) plus anything they've asked about; a non-fitting one 404s even by
  link. The reason is shown in words, never a score. One request per person;
  the host picks (never past `seats`) or says not this time, once. A pick lets
  host and guest message (`canMessage({ pickedGuest })`). SELF takes no
  payments: `costNote` says who covers what.
- **Capital** (`src/lib/app/capital.ts`): `FounderUpdate` + `Profile.openToBackers`
  (off by default; needs one update to switch on). Backers (BACKER/ADMIN) see
  only founders who switched it on, `Follow` them, and send BACKER_INTEREST.
  `mentionsTerms()` guards updates and interest notes. The journal is never
  shown to backers. `/funds` explains why investing isn't available;
  `docs/FUNDS.md` is the plan. Build none of it without a licensed partner.
- **Partners and co-founders** (`src/lib/app/people.ts`): partner intros from
  the app (workspace optional; unclaimed firms go to the concierge);
  co-founders are `openToMatches` people (opt-in, needs a line on what you're
  looking for), hello = ROLE_INVITE (workspace optional), one live per pair.
- The ring (on You) now fills all four quarters: circle peers, partner intros,
  mentors, and backers interested in you.

## Running locally

```
npm install                 # also generates the Prisma client
cp .env.example .env        # set BETTER_AUTH_SECRET (openssl rand -base64 32) and DATABASE_URL
npx prisma migrate deploy   # create tables (Neon or local Postgres)
npm run db:seed             # demo data (re-runnable; resets demo data)
npm run dev                 # http://localhost:3000
npm run lint && npm run typecheck && npm test && npm run build   # before every commit
```

## Carried over from Self1

The rules below were written for Self1. The trust, privacy and AI rules still
apply as each area is rebuilt; routes and component names change. Where a
Self2 phase replaces an area, update its section here.

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

- Hub numbers count per owner (`nextHubNumber()`; unique on owner + number): your
  first hub is "HUB 01". They are labels, not identifiers; use `id`/`slug` to find hubs.
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

## GTM workspace conventions (Phase 8)

- `GtmWorkspace` (one per hub): positioning, customers, channels, launchPlan.
  Section labels, hints and the agent's format guide live in
  `src/lib/gtm-sections.ts`.
- **Agents propose, builders dispose.** `proposeSection()` returns a draft and
  saves nothing. Only `saveSection()` writes, triggered by the builder's Save or
  "Use this". Follow this pattern for every future agent that edits hub content.
- The GTM agent sees the thesis, the builder, open MARKETING/GTM plan steps,
  and the other sections (for consistency). Draft vs sharpen depends on whether
  the section already has saved text.
- Team members see the workspace read-only.

## Personal agents + simulations conventions (Phase 9)

- A personal agent is given exactly `personaText(name, profile)`: the saved
  `Profile.persona`, or a plain restatement of the person's own answers
  (`defaultPersona`, no AI). `/me/agent` shows and edits exactly that text.
  "Rebuild" is a proposal; only Save or "Use this" writes.
- Opt-in (`Profile.simOptIn`) is off by default. Participant rules are pure and
  tested (`src/lib/simulation-rules.ts`): initiator always in and opted in,
  2-4 people, everyone opted in, everyone connected (teammates, candidates,
  accepted connections: `eligiblePeople()`).
- Each simulation freezes `personaSnapshot` + `consentAt` per participant.
- The initiator's browser drives one turn per request (`runNextTurn`). Consent
  is re-checked every turn; any opt-out stops the run (CANCELLED, no report).
  `@@unique([simulationId, index])` makes double-driving harmless.
- Caps: turns 6/9/12, max 4 people, 3 simulations per user per day (plus the
  global daily agent-call cap).
- Only participants can open a simulation. Non-initiators get an email when it
  finishes. Every surface says SIMULATION; the report is aligned / pulled apart /
  talk about this, with no scores, ranks or verdicts (enforced in the prompt).

## Hub agents conventions (Phase 10)

- Roster and copy: `src/lib/hub-agents.ts`. Role briefs and the shared chat
  shape: `src/agents/prompts/hubAgents.ts`. The hub briefing (thesis, plan,
  team, roles, intros, GTM workspace) is built by `hubBriefing()`.
- The briefing lives in the system prompt with `cacheSystem: true`, so it's
  cached across a conversation; the recent history (last 12 messages) and the
  new message go in the user turn.
- Threads are per user, per hub, per agent (`AgentThread.kind = "hub:<key>"`);
  owners and team members can chat, only owners can add a suggested step to the
  game plan (`addSuggestedStep`, which is the explicit "use this" moment).
- The legal explainer is told it isn't a lawyer, shows a fixed "not legal
  advice" banner linking to Legal partners, and the server appends the
  disclaimer if a reply ever lacks it.
- Fundraising prep practises and prepares; it never drafts offering documents
  or solicitations.
- "Ask SELF anything" (`/ask`) routes with `routerAgent` (keyword routing in
  demo mode) and opens the chosen agent with the question.

## Admin conventions (Phase 11)

- `/admin/*` is ADMIN only: `requireAdmin()` (`src/lib/admin.ts`) at the top of
  every page and action. Non-admins get a 404. Admin writes live in
  `src/lib/admin.ts`; `src/app/admin/actions.ts` only validates and revalidates.
- Admins see login emails, names, roles and counts. They do **not** see
  `contactEmail`/`contactLink`, signal notes, thesis text or plans.
- `Hub.featured` (admin-set) puts a hub first on `/roles` and `/backers`, the only
  public mosaics. Partners already sort by `featured` in the directory.
- Linking a PARTNER user to a firm (`setPartnerManager`) moves that firm's
  PENDING intros to them; unlinking moves them back to the concierge.
- Cost: `AgentRun` logs input, output, cache-read and cache-write tokens.
  `src/lib/agent-cost.ts` (unit tested) turns them into estimated USD from list
  prices. Update `PRICES_PER_MTOK` when the model or prices change.
- Admin screens may use tables (`components/admin/AdminShell`): hairlines, mono
  headers, no KPI cards or charts beyond the single-color day bars.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
