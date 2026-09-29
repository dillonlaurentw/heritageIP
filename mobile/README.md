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

## Store builds

Use EAS (`npx eas-cli@latest build`) when you're ready for TestFlight and the
Play Store. Set `EXPO_PUBLIC_API_URL` to the live site and leave
`EXPO_PUBLIC_DEMO` unset.
