# ارز من · ArzMan

A Persian-first personal iPhone currency dashboard built on **Expo SDK 57, React Native 0.86, TypeScript and Expo Router**, developed on Windows. It reads Iranian open-market USD/EUR/AED/IQD quotes through a Cloudflare service. No paid market-data API key is required.

**Status:** source code, automated domain/parser/cache tests and JavaScript exports are available. Physical-iPhone QA, a signed EAS build and Cloudflare deployment have not been performed. The current TGJU pages do not provide a complete trade timestamp; quotes are deliberately marked stale/unverified. This is not a claim of production readiness.

## What is included

- Persian dashboard, markets, currency details, converter, watchlist, custom rates and dark/light/system appearance.
- Native Liquid Glass when supported, a blur fallback, opaque readable market cards, native navigation sheets, safe-area layout and haptics.
- Rial/toman preferences, Persian/English number formatting and explicit source quote sizes.
- Local transactions, weighted average cost, realized/unrealized P&L, allocation, daily estimated change and device-authentication guards.
- Foreground-only threshold, percentage and rapid-movement alerts, disabled for stale prices.
- Real backend observation history across 1H/1D/1W/1M/3M/1Y, with touch selection and no generated price history.
- Shared schemas, parser fixtures, protected last-known-good cache and restart-persistent server history.

USDT is a separate provider contract; no live USDT feed is enabled. A user-entered USDT price is explicitly labelled manual. Widgets, Live Activities, Siri and background push are disabled typed adapters plus implementation documentation.

## Architecture

```text
apps/mobile          Expo Router screens, shared UI, one foreground data store
packages/shared      Zod models, normalization, conversion, accounting, alert rules
server               Cloudflare Worker + one SQLite Durable Object
server/src/providers/tgju  Public HTML fetch, metadata checks, primary/fallback parser
server/test/fixtures  Captured relevant TGJU HTML, never used as application data
docs                 Source research, native roadmap, QA and original request
```

The mobile app only requests our service. One global Durable Object serializes refreshes, fetches TGJU at most once per five-minute cycle and retains the complete valid snapshot on failure. Four large HTML profiles made a five-minute source interval a more conservative initial choice than 30–60 seconds. The app checks the cached backend every 60 seconds by default, suspends polling when inactive, cancels abandoned requests and backs off on failure. Source freshness and network connectivity are separate states.

## Windows quick start

Install Node.js 24 LTS and Git. npm is used throughout; do not mix lockfiles. From PowerShell:

```powershell
cd D:\MY_APP\Arz_Man
npm ci
npm run check
```

Start the backend in terminal one:

```powershell
cd D:\MY_APP\Arz_Man
npm run server
```

In terminal two, create local configuration if it does not already exist:

```powershell
cd D:\MY_APP\Arz_Man
Copy-Item apps/mobile/.env.example apps/mobile/.env.local
notepad apps/mobile/.env.local
```

Set `EXPO_PUBLIC_API_URL` to your PC's Wi-Fi/LAN IPv4 address, e.g. `http://192.168.1.100:8787`. Find the address with `ipconfig`. **Do not use localhost for the physical iPhone**: that would refer to the phone. The local file created during this session uses this PC's observed LAN address; change it if your network changes. It is ignored by Git.

Start Expo:

```powershell
npm run start -w @arzman/mobile -- --go
```

Keep the PC and iPhone on the same network. Scan the terminal QR code with the iPhone camera. If Windows asks about firewall access, permit the development servers only on your trusted private network. A VPN or isolated guest Wi-Fi may block connectivity. You can press `w` for a browser preview, or open [the local preview](http://localhost:8081).

**Expo Go compatibility:** the installed Expo Go must support SDK 57. The official [SDK 57 release notes](https://expo.dev/changelog/sdk-57) describe App Store availability limitations. If your installed Expo Go rejects SDK 57, use an EAS development build. Face ID permission testing and future native extensions require a development build regardless.

Environment changes require restarting Metro. A phone using a Metro tunnel still needs a reachable backend URL; a tunnel for Metro does not expose port 8787.

## Backend endpoints and deployment

```text
GET /health
GET /api/market
GET /api/market/USD
GET /api/history/USD?range=1D
```

Allowed currencies: USD/EUR/AED/IQD. Allowed ranges: 1H/1D/1W/1M/3M/1Y. A cold source failure returns HTTP 503; a later failure returns the last good snapshot with stale flags. `sourceTimestamp` is null when the source supplies no trustworthy full timestamp. `fetchedAt` must never be presented as the trade time. Prices are normalized per one currency unit, and raw value, raw unit and quote size are retained.

Cloudflare account login is required for deployment, but there is no market API secret:

```powershell
cd D:\MY_APP\Arz_Man\server
npx wrangler login
npm run deploy
```

The checked-in configuration creates a **SQLite-backed Durable Object**, supported by the [Workers Free plan](https://developers.cloudflare.com/durable-objects/platform/pricing/) within its quotas. No D1/KV ID needs to be pasted into configuration. Deployment URL and account quotas must be checked after deployment. The first market request starts the persistent five-minute alarm/observation loop. Configure a restrictive web `ALLOWED_ORIGIN` if exposing a hosted web client; `*` is the development default for public quote data and is not authentication. Before a broad public launch, add edge rate limits and review source redistribution terms.

Set the mobile `EXPO_PUBLIC_API_URL` to the returned HTTPS Worker URL, then restart Metro or rebuild. Public `EXPO_PUBLIC_*` values are bundled into the app; never put secrets there. Cloudflare/EAS credentials remain in their CLIs or account secret stores.

## EAS development, production and TestFlight

The profiles in `apps/mobile/eas.json` configure internal development/preview builds and production auto-increment. Project/account identifiers and signing are intentionally not invented. Before the first build, confirm the bundle ID `com.arzman.personal` is available for your account or change it to your own unique ID.

```powershell
cd D:\MY_APP\Arz_Man\apps\mobile
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
npx expo start --dev-client
```

Physical-device EAS distribution normally requires your Apple Developer signing setup. EAS prompts guide device registration and signing. Windows can submit the cloud build; local Xcode is not required. Set `EXPO_PUBLIC_API_URL` for each EAS build environment to the deployed HTTPS endpoint before building; local ignored `.env.local` is not a release configuration.

```powershell
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production
```

TestFlight also requires App Store Connect setup and Apple processing. These commands are documented, not executed. SDK 57 includes scene-support configuration in app.json for builds against iOS/Xcode 27. See [native capability notes](docs/NATIVE-CAPABILITIES.md).

## Data privacy and limitations

- Portfolio transactions remain on the device. iPhone stores each transaction as a small Keychain item; only its opaque ID index is in SQLite. Settings, watchlist, alerts, custom rates and market cache occupy separate keys. Cache clearing does not erase transactions.
- The browser preview uses localStorage and does **not** offer encrypted portfolio storage or device authentication. Use sample data there.
- The privacy switch guards portfolio/transaction screens and hides the home portfolio summary, relocking when backgrounded or when leaving the portfolio. Native Face ID, app-switcher snapshots and VoiceOver still require device QA. It is not a claim of a hardened encrypted wallet.
- There is no portfolio export/recovery flow yet; do not rely on this development build as your only transaction record.
- Current TGJU time labels are incomplete, so alerts do not currently fire on those quotes. No closed-app push delivery exists.
- The history starts with this backend's actual collection period. Lines connect observed samples, not fabricated exchange ticks. One-year retention is implemented; one year's data does not appear immediately.
- Watchlist order persists; removing/re-adding moves a currency to the end. Drag reordering is not implemented.
- Chart smoothing/animation and final on-device spacing/accessibility polish remain. Native widgets/ActivityKit/App Intents are not compiled extensions yet.

## Validation and maintenance

Run from the repository root:

```powershell
npm run typecheck
npm run lint
npm test
npm run check
cd apps/mobile
npx expo-doctor
npx expo export --platform all
```

Exports verify JavaScript/asset bundling, **not** a signed native build. Tests never contact TGJU; fixtures are frozen source excerpts. Research live requests are kept separate and rate-limited. The lockfile pins the SDK-compatible animation dependencies; root dev pins/overrides avoid npm installing newer incompatible peer copies.

See [QA status](docs/QA.md), [TGJU research](docs/TGJU-RESEARCH.md), [TODO](TODO.md) and [HANDOFF](HANDOFF.md). The full original request is preserved in `docs/REQUEST.txt`. Update HANDOFF.md before ending future coding sessions.
