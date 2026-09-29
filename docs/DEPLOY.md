# Deploying SELF (Vercel + Neon)

A step-by-step for putting SELF on the internet. About 30 minutes. You need a
GitHub account (you have one), a Vercel account and a Neon account (both free
to start).

---

## 1. The database (Neon)

You already have a Neon project from running locally. For production, make a
**separate branch or project** so demo data never mixes with real people.

1. In Neon, open your project → **Branches** → **Create branch** → name it `main`
   (or create a new project called `self-production`).
2. Copy its connection string (Dashboard → **Connect**). Use the one **without**
   `-pooler` in the host for running migrations.
3. **Reset the password** you pasted into chat earlier (Roles → your role →
   Reset password), then copy the new string. Old strings stop working.

## 2. The app (Vercel)

1. Go to vercel.com → **Add New… → Project** → import `heritageIP` from GitHub.
2. Framework: Next.js (auto-detected). Leave the build command as it is.
3. Add the environment variables below (Settings → Environment Variables), then
   **Deploy**.

### Environment checklist

| Variable | What to put | Needed? |
|---|---|---|
| `DATABASE_URL` | Neon connection string (the production branch) | Yes |
| `BETTER_AUTH_SECRET` | Run `openssl rand -base64 32` on your Mac and paste the result | Yes |
| `BETTER_AUTH_URL` | Your site address, e.g. `https://self.vercel.app` (no trailing slash) | Yes |
| `ADMIN_EMAILS` | Your email, so you get the Admin area | Yes |
| `RESEND_API_KEY` | From resend.com (for magic-link sign-in and notification emails) | Yes, for real sign-in |
| `EMAIL_FROM` | e.g. `SELF <hello@yourdomain.com>` (a domain verified in Resend) | Yes, with Resend |
| `ANTHROPIC_API_KEY` | From console.anthropic.com. Without it, agents run in demo mode | For real AI |
| `AGENT_DAILY_RUNS` | Agent calls per person per day, e.g. `40` | Optional |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob → create a store → token (image uploads) | For uploads |
| `CONCIERGE_EMAIL` | Who answers intros for partners that haven't claimed a profile | Optional |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in (Google Cloud console) | Optional |
| `DEMO_LOGIN` | Leave **unset** in production (it lets anyone sign in as demo people) | No |

Secrets live only in Vercel's settings. Never commit them.

## 3. Create the tables

On your Mac, in the project folder, point at the production database once:

```
DATABASE_URL="<production connection string>" npx prisma migrate deploy
```

Do **not** run `npm run db:seed` against production: the seed resets demo data.
If you want the partner directory filled in, add partners from the Admin area
or ask me for a partners-only seed.

## 4. Smoke test (10 minutes)

Sign in with your admin email, then walk through:

1. **Start**: New workspace → write the idea → answer the thesis questions →
   Use this → Plan with SELF → add the steps.
2. **Pages**: open Start here, type `/` and add a heading, a to-do and a
   database. Select text → Ask AI → Summarise → Insert below.
3. **Team**: People → invite a second email you own. Open the same page in two
   browsers: you should see each other's avatar and edits within a second.
4. **Comments**: select text → Comment → mention the other person. Check their
   Inbox and email.
5. **Operations**: add a meeting with a to-do → Send to Tasks → check Tasks and
   This week.
6. **Network**: open a Supplier step → find a partner → Request intro. As admin,
   answer it from Connections (you're the concierge).
7. **Admin**: /admin → AI usage shows the runs you just made.

If anything fails, Vercel → your project → **Logs** shows the error. Send it to
me as-is.

## 5. Costs to watch

- **Anthropic**: every real agent call is logged; Admin → AI usage estimates the
  spend. The per-person daily cap (`AGENT_DAILY_RUNS`) is your brake.
- **Vercel**: live co-editing polls the server about once a second while two
  people share a page (every 4s when alone, 15s in a background tab). Fine for a
  small team on the free or Pro plan; if SELF grows to many people editing at
  once, swap in a hosted sync service (see `docs/PLAN.md`, Phase 11).
- **Neon**: free tier covers early use; the app keeps its own tables small
  (co-editing history is compacted automatically).

## Before real users

- Have a lawyer read the "Introductions only" wording on backer pages
  (`src/components/network/NotAnOffer.tsx`), and add terms and privacy pages
  (SELF doesn't have them yet).
- Turn on Resend domain verification so emails don't land in spam.

---

## A demo site you can send people (separate from the real one)

For showing SELF to people before real users arrive. Visitors land on the
sign-in page and click "sign in as" Maya, Priya, Harbor & Vine and so on. No
email, no accounts. Keep it completely separate from any real site.

1. **Neon:** create a new project called `self-demo`. Copy its connection string.
2. **Tables and demo data**, once, from your Mac in the project folder:
   ```
   DATABASE_URL="<self-demo connection string>" npx prisma migrate deploy
   DATABASE_URL="<self-demo connection string>" npm run db:seed
   ```
3. **Vercel:** Add New → Project → import `heritageIP` again, name it `self-demo`.
   Environment variables:
   - `DATABASE_URL`: the `self-demo` connection string
   - `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
   - `BETTER_AUTH_URL`: the address Vercel gives you, e.g. `https://self-demo.vercel.app`
   - `DEMO_LOGIN`: `true` (this is what shows "sign in as")
   - `ANTHROPIC_API_KEY`: optional. Without it, the agents give demo answers.
     With it, every visitor's click costs real money: set `AGENT_DAILY_RUNS=10`.
4. **Deploy**, open the address, and send it.
5. **Reset it** whenever visitors have changed things: run the `db:seed`
   command from step 2 again. It puts every demo person back as they were.

Everyone who opens the link shares the same demo people, so two visitors can
see each other's clicks. That's fine for a demo; never put real people or real
data on this site.
