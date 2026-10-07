# Development

## Setup

Node.js 24 LTS and Git; npm throughout.

```bash
npm ci
npm run check
```

`apps/mobile/.env.local` (git-ignored) holds the market API:

```bash
EXPO_PUBLIC_API_URL=https://arzman-market.<your-account>.workers.dev
```

`EXPO_PUBLIC_*` values are bundled into the app: never put secrets there. Metro
caches them — pass `--clear` after changing it.

To develop the backend itself, run `npm run server` (Worker on `:8787`) and point
`EXPO_PUBLIC_API_URL` at `http://127.0.0.1:8787` (or your LAN address for a phone).

## Running the app

| Target | How |
|---|---|
| Browser | `npm run start`, press `w` |
| iPhone | Expo Go from the App Store: `npm run start -w @arzman/mobile -- --go`, scan the QR code. Expo Go and the CLI must use the same Expo account. |
| Android | Expo Go the same way, or install the APK — see [android-install.md](android-install.md) |
| Web build | `npm run build:web -w @arzman/mobile`, then serve `apps/mobile/dist` |

A development build (EAS) is only needed for the app's own icon and identity or native
extensions, and iOS builds need a paid Apple Developer account.

## Checks

```bash
npm run typecheck     # shared, server, mobile
npm run lint
npm test              # vitest: shared domain, server parsers, SQL plans, schedule
npm run verify        # live TGJU sources (network)
cd apps/mobile && npx expo-doctor
```

CI runs typecheck, lint, tests and an Android bundle export on every push and pull
request.

## Conventions

- All text through `Label`; fills behind white text use `accentSolid`, never `accent`.
- One brand surface (`QuoteHero`) per screen. Sparklines only from real observations.
- Persian line height ≥ 1.5625×; no letter-spacing on Persian.
- Verify layout at 393×852, in dark and light.
- Never generate market prices or history. Unknown units fail closed.
- Commits: small, imperative, `feat(scope): …` / `fix(scope): …` / `docs: …`.
