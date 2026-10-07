# Deployment

Nothing here runs automatically; every step needs the owner's accounts.

## Market API (Cloudflare Worker)

No market-data secret exists. Log in once, then deploy:

```bash
cd server
npx wrangler login
npm run deploy
```

The configuration creates a SQLite-backed Durable Object, which the Workers Free plan
supports within its quotas (5 M rows read/day). After deploying:

```bash
npx tsx scripts/audit-api.ts https://arzman-market.<your-account>.workers.dev
```

All checks should pass, and `GET /api/v2/market` should return 24 quotes while
`GET /api/market` returns exactly 4 (see [ARCHITECTURE.md](ARCHITECTURE.md)).
`ALLOWED_ORIGIN` is `*` by default (public quote data, not authentication); restrict it
if you host a web client on a known origin.

## Android APK (EAS)

The `preview` profile builds a signed standalone APK; keep using the same signing key
so new builds install over old ones. `EXPO_PUBLIC_API_URL` lives in the EAS
`preview` and `production` environments (cloud builds never see `.env.local`).

```bash
cd apps/mobile
npx eas-cli build --platform android --profile preview
```

The free EAS queue can take from minutes to hours. Do not hand out a development-client
build: it expects Metro. Install steps for friends: [android-install.md](android-install.md).

## Web version (Add to Home Screen)

Served as static files by a second Worker named `arzman` (`apps/mobile/wrangler.jsonc`,
with a single-page-app fallback so deep links load).

```bash
cd apps/mobile
npx expo export --platform web --output-dir dist --clear
grep -c "127.0.0.1" dist/_expo/static/js/web/*.js    # must be 0
npx wrangler deploy
```

**Always pass `--clear`** after any export that overrode `EXPO_PUBLIC_API_URL`: Metro
caches the old value and the site would ship pointing at localhost.

## iPhone

Free route: Expo Go. A real build with the app's own icon needs a paid Apple Developer
account; no route installs an app on an iPhone without an Apple ID.
