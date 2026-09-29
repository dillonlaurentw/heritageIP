# SELF 3: build plan (current)

Self3 keeps everything Self2 built (workspaces, pages, databases, agents,
network, simulations, live co-editing) and changes what SELF feels like and
what it centres on. It follows the prototype you approved
(claude.ai/artifact/YVGqq9CK1tV5Cj3VpG9pLZ): founder first, then the team.

**The idea in one line:** you in the middle, four kinds of people around you
(co-founders, partners, advisors, capital), and AI that knows you, your team
and your business.

Status: building Self3 phases 1–8 in order (you asked for the full build).
Self2's plan is kept below for history.

## How Self3 is built
- **Same foundations.** Sign-in, data, agents (caps, cost logging, demo mode),
  signals, contact rules, the hard rules in CLAUDE.md: all unchanged.
- **New design language.** Quiet and warm, in the spirit of Jony Ive: Geist,
  a warm off-white, white cards with soft depth, black pill buttons, orange only
  for "needs you". Swapped through the tokens, so every Self2 screen follows.
- **The ring is the home.** Your company's people, arranged in four arcs, with
  open chairs where the plan needs someone.
- **Three kinds of AI.** Your Self (the AI version of you), team rehearsals,
  and business help (area specialists and what-if checks).
- **Capital through a licensed partner, later.** SELF still moves no money.
  The company page has a clearly marked seam for a licensed partner; nothing
  about investing is built until that partner exists.

## Self3 phase 1: The new design language
**Build:** Geist + Geist Mono, warm light and dark palettes, pill buttons,
rounder cards, soft shadows on cards; a quieter sidebar; the landing page
rebuilt around the ring. CLAUDE.md design rules rewritten.
**Click through:** landing, sign-in, any workspace page, `/style-guide`, dark mode.

## Self3 phase 2: The ring
**Build:** the ring (pure layout rules, tested) drawn from real data: team
members (co-founders), accepted partner intros (partners), mentors (advisors),
backers who showed interest (capital), open roles and unmet plan needs (open
chairs). "You" home: your ring, and what needs you (requests to answer, steps
missing someone, matches waiting). Each workspace home gets its own ring.
**Click through:** sign in as Maya → the Tidewater ring → click an open chair.

## Self3 phase 3: Your Self
**Build:** your Self page: what you believe, why you build, how you decide,
what gives and drains energy, non-negotiables, what you're building toward.
Every line shows where it came from and can be edited. "Is this you?"
suggestions the agent proposes and you accept or reject. Opt-in switch and
every rehearsal your Self joined. The persona the agent gets is built from
exactly these lines.
**Click through:** `/me/self` → edit a line → accept a suggestion → turn opt-in off.

## Self3 phase 4: Idea → questions → thesis → plan
**Build:** one flow with a step indicator. Questions one at a time (skip, "I
don't know yet", "enough, draft it"); a thesis draft with "still unproven";
plan build-out where each step says who it needs, gaps show on the ring, keep
or drop steps, then "Use this plan". Nothing saved until you use it.
**Click through:** new idea → 3 questions → thesis → plan → ring shows the gaps.

## Self3 phase 5: Matches and messages
**Build:** co-founder and advisor matches explained in words (never scored);
direct messages between connected people; propose a trial week inside the
conversation; when it's accepted they join the company as a member.
**Click through:** open chair → match → start a conversation → propose a trial → accept.

## Self3 phase 6: Help by area
**Build:** eight areas (go-to-market, marketing & brand, sales, product, legal,
fundraising prep, hiring & team, operations & budget). Each has a specialist
agent, a working page with sections the agent drafts (use / sharpen / discard),
the plan steps in that area and the people on SELF who do this work.
**Click through:** Help by area → Go-to-market → draft channels → use it.

## Self3 phase 7: What-if checks and team rehearsals
**Build:** business what-ifs: describe something that might happen, see which
steps slip, which arcs of the ring it touches, what it means for money in
words, and suggested changes you can add to the plan. Team rehearsals: the
Self2 simulations restyled, with "take it to <name>" opening a message.
**Click through:** game plan → "Check a what-if" → add two changes.

## Self3 phase 8: Capital, backers, partners and phone
**Build:** the company page backers see; a backer home (companies followed,
interest sent); a partner home (intros waiting, steps they're attached to);
the licensed-partner seam for investing, off and clearly labelled; a phone
pass on the main screens.
**Click through:** sign in as Priya (backer) and as Harbor & Vine (partner); the ring on a phone.

---

# SELF 2: build plan (done, for history)

Self2 turns SELF into one workspace for building a company, from the first
idea to running the business and the team. It works like Notion (pages, docs,
databases), with SELF's idea → thesis → game plan path, AI agents and network
built in. Self1 (the Project Hub version) is saved on the `self1` branch.

Each phase ends in something you can click through at `http://localhost:3000`.
I stop after each phase, tell you what to test, commit, and wait for your go-ahead.

Status: all phases (0–11) built. Next: deploy (see `docs/DEPLOY.md`).
Decisions made: calm design everywhere · first usable version covers everything
Self1 did and more · live co-editing comes later, as its own phase · live
co-editing runs through SELF's own server and database (no extra service).

---

## How Self2 is built

- **Same foundations, new structure.** Sign-in, the database, email, AI agents
  (caps, cost logging, demo mode), the Signal network and all the trust rules
  carry over from Self1. The screens and the data model around hubs are rebuilt.
- **Workspaces replace hubs.** A workspace is one company or idea, with members.
- **Everything is a page.** Pages nest, hold blocks (text, headings, to-dos,
  images, embeds), and can be databases. A database row is itself a page.
- **Self1's features become pages and databases.** Thesis and go-to-market are
  page templates; the game plan, tasks, roles, meetings and goals are databases.
- **Fresh start for data.** Self2 has a new database structure and new demo
  data. Nothing real is lost: Self1 only ever held demo data.

---

## Phase 0: Design foundation and app shell
**Build:** new calm design system (Inter, light + dark mode, neutral palette,
SELF orange accent, 6px radius). Core UI primitives: buttons, inputs, menus,
dialogs, tooltips, tags, toasts. The app shell: left sidebar with workspace
switcher, search, inbox and page tree; top bar with breadcrumbs; ⌘K command
palette. A new landing page and a style guide.
**Click through:** `/style-guide` in light and dark, the empty shell, ⌘K.

## Phase 1: Accounts, onboarding, workspaces
**Build:** sign-in restyled; the reflective onboarding carried over in the calm
style; create a workspace (from an idea, or blank); invite people by email;
member roles (Owner, Admin, Member, Guest) enforced on the server; personal
space for private pages.
**Click through:** sign up → onboarding → create "Tidewater Kelp" → invite a teammate.
**Seed:** demo people and 4 to 6 workspaces.

## Phase 2: Pages and the editor
**Build:** nested pages in the sidebar (create, rename, drag to reorder or move,
duplicate, delete to trash, restore). BlockNote editor with `/` menu: text,
headings, lists, to-dos, quotes, callouts, dividers, images, links to other
pages. Page icons and covers, full-width toggle, autosave, version history,
search across pages.
**Click through:** build a small wiki; move pages around; restore from trash.

## Phase 3: Databases
**Build:** databases with typed properties (text, number, select, multi-select,
status, person, date, checkbox, URL, relation). Views: table, board, list and
calendar, each with its own filters, sorts and grouping. Rows open as pages.
Inline databases inside any page.
**Click through:** a Tasks database: add rows, switch to board, filter to
"mine", open a task and write notes in it.

## Phase 4: Idea → thesis → game plan
**Build:** "Start from an idea": the thesis dialogue from Self1, now producing a
Thesis page. The game plan becomes a database (stage, need tags, owner, due
date) generated by the agent, fully editable. Need tags link to the right part
of the network. Go-to-market template. A template gallery.
**Click through:** idea → thesis → generated game plan board → click a LEGAL tag.

## Phase 5: AI on every page
**Build:** "Ask AI" on any page or selection (draft, rewrite, summarise, turn
into tasks), always as a proposal you accept or discard. The workspace agents
from Self1 (strategy, go-to-market, operations, fundraising prep, legal
explainer) with the full workspace as context. ⌘K "Ask SELF anything".
Daily caps and cost logging as in Self1.
**Click through:** select a paragraph → "turn into tasks" → accept → rows appear.

## Phase 6: Team and company operations
**Build:** member directory with roles and focus areas; hiring (role openings,
posted to the network board, candidates as a database); meeting notes template
whose action items become tasks; goals (company goals with progress from linked
tasks); customers and suppliers database (a simple CRM); a weekly "what
changed" summary page.
**Click through:** run a meeting note → action items land in Tasks → goal progress moves.

## Phase 7: The network
**Build:** everything Self1 connected you to, rebuilt in the new design:
co-founder and teammate roles, mentors, the partner directory (manufacturing,
legal, marketing, website/build, design, finance), backer discovery (interest
only, never amounts or terms), and the connections inbox. Requests can be tied
to a game-plan row so an intro shows up on the step that needed it. Contact
details only after an accepted signal, checked on the server.
**Click through:** a SUPPLIER step → partner → request intro → partner accepts →
the intro appears on the step.

## Phase 8: Personal agents and simulations
**Build:** persona page ("how your agent sees you", editable), opt-in, team
simulations with transcript and conversation-starter report, all labelled
SIMULATION. Same consent rules as Self1.

## Phase 9: Comments, mentions and notifications
**Build:** comments on pages and blocks, @mentions of people and pages, an inbox
in the sidebar, email for the important ones (mentions, requests, accepted intros).

## Phase 10: Admin
**Build:** the Self1 admin rebuilt in the calm design: people, workspaces,
partners, signals, AI usage and cost, featuring and partner linking.

## Phase 11: Live co-editing
**Build:** two or more people editing the same page at once, with cursors and
"who's here" presence (Yjs plus a hosted sync service). Its own phase because it
adds a real-time service to run and pay for.
**As built:** no hosted service. The shared document is stored in Postgres as
Yjs updates and synced by short HTTP polling (fast while others are on the page,
slow when you're alone), which works on Vercel with nothing else to sign up for.
If SELF grows to many people editing at once, swap the provider in
`src/components/editor/collab.ts` for a hosted one (Liveblocks, y-sweet,
PartyKit); nothing else changes.

## After Phase 11
Vercel + Neon deploy walkthrough, environment checklist, and a smoke test of
every main flow: `docs/DEPLOY.md`.

---

## What carries over from Self1 unchanged
- The hard rules in CLAUDE.md (no money moves or investing, simulations
  labelled, consent for personal agents, legal agent isn't a lawyer, contacts
  only through accepted signals).
- `src/agents/` structure: `runAgent()`, caps, `AgentRun` cost logging, demo mode.
- The Signal state machine and `contactsFor()` contact reveal.
- The no-terms guard on every backer-facing text field.
