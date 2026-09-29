# SELF app (iPhone and Android)

Stage 1 of SELF: founding circles. Invite-only access, a circle of up to six
founders with a weekly check-in, mentor office hours, messages and your Self.
Partners, co-founders and capital show as "later".

Built with Expo (SDK 57) and Expo Router. It has no database of its own: it
talks to SELF's web server at `/api/m/*` with a sign-in token.

## Run it

```
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://<your computer's IP>:3000 npx expo start
```

Scan the QR code with the Expo Go app on your phone. The web server
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
