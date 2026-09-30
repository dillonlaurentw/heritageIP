# SELF app (iPhone and Android)

Stage 1 of SELF. Invite-only access, a private daily journal you can talk to,
a small matched circle of founders (a quiet group chat), mentors you ask
directly, messages and your Self. Opportunities, partners and capital come later.

Built with Expo (SDK 57) and Expo Router. It has no database of its own: it
talks to SELF's web server at `/api/m/*` with a sign-in token.

## Run it

```
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://<your computer's IP>:3000 npx expo start
```

Scan the QR code with the Expo Go app on your phone. Hold-to-talk needs a
development build (`npx expo run:ios` / `run:android`, or an EAS development
build) because speech recognition is a native module; in Expo Go the journal
falls back to typing (the keyboard's own mic still works). The web server
(`npm run dev` in the repo root) must be running. In development the sign-in
screen offers "Demo · sign in as" for the seed people.

## Web preview

`npm run export:web` builds the app into `../public/app`, so the web server
serves it at `/app` (same address, no extra setup). That's what the demo
video records. Re-run it after changing the app, and commit `public/app`.

## Getting it into the App Store and Google Play

The app is set up for Expo's build service (EAS): `eas.json` has three
profiles (development, preview for testers, production for the stores).

1. Accounts: an Apple Developer account (about $99/year) and a Google Play
   developer account (about $25 once).
2. `npx eas-cli@latest login`, then `npx eas-cli@latest init` in `mobile/`.
   It creates the EAS project; copy its id into `app.json` →
   `expo.extra.eas.projectId` (push notifications need it).
3. Put your live site's address in `eas.json` (`[YOUR-SITE]`,
   `[YOUR-DEMO-SITE]`).
4. Testers: `npx eas-cli@latest build --profile preview --platform all`.
   Hold-to-talk and push notifications work in these builds (not in Expo Go).
5. Stores: `npx eas-cli@latest build --profile production --platform all`,
   then `npx eas-cli@latest submit --platform ios` / `android`.

What the stores will ask for, and where it is:

- Privacy policy and terms: `/privacy` and `/terms` on the web app (drafts;
  have a lawyer review them and fill in the contact emails).
- Report and block for anything people post, and a way to delete your
  account in the app: You → Delete my account (both built).
- A demo account for Apple's reviewer: set `DEMO_LOGIN=true` on a separate
  review site and give them the invite code, or a real test account.
- App privacy answers: email, name, user content (journal, messages),
  push tokens; no tracking, no payments, no location.
