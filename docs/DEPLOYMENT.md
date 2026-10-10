# Deployment

Nothing here runs automatically; every step needs the owner's accounts.

## Deploy from GitHub (no terminal)

1. Cloudflare dashboard → My Profile → API Tokens → Create Token → template
   **Edit Cloudflare Workers** → create and copy the token.
2. GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
   name `CLOUDFLARE_API_TOKEN`, value the token.
3. Actions tab → **Deploy** → Run workflow. It runs `npm run check`, deploys the
   Worker, checks `/api/market` returns exactly 4 quotes, builds the web app against
   that Worker and deploys it.

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

### Optional: fallback source and stale-data alert

Both are off until you set a secret; the Worker works exactly as before without them.

```bash
cd server
npx wrangler secret put BRSAPI_KEY          # free key from brsapi.ir; enables the fallback
npx wrangler secret put ALERT_WEBHOOK_URL   # e.g. https://ntfy.sh/<long-random-topic>
npm run deploy
```

- While TGJU fails, `/api/v2/market` serves the four core currencies from BRSAPI (each quote says
  `source: "BRSAPI"`). `/api/market` (v1) never does — old installs require `TGJU`.
  BRSAPI prices must agree with the last TGJU snapshot within 2x, otherwise they are ignored.
- A cron (every 15 min) alerts the topic once when no source has delivered fresh data for
  `STALE_ALERT_MINUTES` (default 30), repeats every 6 h, and says when data recovers. Install the
  free ntfy app on the phone and subscribe to the same topic.
- `GET /api/health` returns 200/503 and the data age, for an external monitor such as UptimeRobot.

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

### Android APK from GitHub

Expo account → Access tokens → create one, then add it as the repository secret
`EXPO_TOKEN`. Actions → **Android release** → Run workflow with a tag such as `v0.2.0`.
It builds the `preview` APK on EAS and attaches it to a GitHub Release (the free EAS
queue can take hours).

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
