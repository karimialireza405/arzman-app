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

The mobile app only requests our service. One global Durable Object serializes refreshes, fetches TGJU at most once per 45-second cycle (with exponential backoff on failures) and retains the complete valid snapshot on failure. The app checks the cached backend every 30–300 seconds by default, suspends polling when inactive, cancels abandoned requests and backs off on failure. Source freshness and network connectivity are separate states.

## Windows Quick Start

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

## Backend Endpoints and Deployment

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

The checked-in configuration creates a **SQLite-backed Durable Object**, supported by the [Workers Free plan](https://developers.cloudflare.com/durable-objects/platform/pricing/) within its quotas. No D1/KV ID needs to be pasted into configuration. Deployment URL and account quotas must be checked after deployment. The first market request starts the persistent 45-second alarm/observation loop with exponential backoff on failures. Configure a restrictive web `ALLOWED_ORIGIN` if exposing a hosted web client; `*` is the development default for public quote data and is not authentication. Before a broad public launch, add edge rate limits and review source redistribution terms.

Set the mobile `EXPO_PUBLIC_API_URL` to the returned HTTPS Worker URL, then restart Metro or rebuild. Public `EXPO_PUBLIC_*` values are bundled into the app; never put secrets there. Cloudflare/EAS credentials remain in their CLIs or account secret stores.

## EAS Development, Production and TestFlight

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

## Feature Compatibility Matrix (Expo Go vs EAS Development Build)

| Feature | Expo Go (SDK 57) | EAS Dev Build | Notes |
|---------|------------------|---------------|-------|
| Market data (live rates) | ✅ | ✅ | Works in both |
| Converter | ✅ | ✅ | Works in both |
| Portfolio (local transactions) | ✅ | ✅ | Works in both |
| SecureStore (Keychain on iOS) | ⚠️ Limited | ✅ | Expo Go on iOS has no Keychain; uses web localStorage fallback |
| Face ID (expo-local-authentication) | ❌ | ✅ | Requires native binary; Expo Go cannot prompt Face ID |
| Haptics | ✅ | ✅ | Works in both (web fallback) |
| SF Symbols (expo-symbols) | ❌ | ✅ | Native module; iOS only in dev build |
| Charts (react-native-svg) | ✅ | ✅ | Works in both |
| Notifications (local/foreground) | ✅ | ✅ | Foreground alerts only |
| Background Push Notifications | ❌ | ✅ | Requires APNs credentials & server infra |
| Widgets (WidgetKit) | ❌ | ✅ | Requires native extension + App Group |
| Live Activities / Dynamic Island | ❌ | ✅ | Requires native extension + ActivityKit |
| Siri / App Intents | ❌ | ✅ | Requires native extension + App Intents |

## Data Privacy and Limitations

- Portfolio transactions remain on the device. iPhone stores each transaction as a small Keychain item; only its opaque ID index is in SQLite. Settings, watchlist, alerts, custom rates and market cache occupy separate keys. Cache clearing does not erase transactions.
- The browser preview uses localStorage and does **not** offer encrypted portfolio storage or device authentication. Use sample data there.
- The privacy switch guards portfolio/transaction screens and hides the home portfolio summary, relocking when backgrounded or when leaving the portfolio. Native Face ID, app-switcher snapshots and VoiceOver still require device QA. It is not a claim of a hardened encrypted wallet.
- There is no portfolio export/recovery flow yet; do not rely on this development build as your only transaction record.
- Current TGJU time labels are incomplete, so alerts do not currently fire on those quotes. No closed-app push delivery exists.
- The history starts with this backend's actual collection period. Lines connect observed samples, not fabricated exchange ticks. One-year retention is implemented; one year's data does not appear immediately.
- Watchlist order persists; removing/re-adding moves a currency to the end. Drag reordering is not implemented.
- Chart smoothing/animation and final on-device spacing/accessibility polish remain. Native widgets/ActivityKit/App Intents are not compiled extensions yet.

## Validation and Maintenance

Run from the repository root:

```powershell
npm run typecheck
npm run lint
npm test
npm run check
npm run verify
cd apps/mobile
npx expo-doctor
npx expo export --platform all
```

Exports verify JavaScript/asset bundling, **not** a signed native build. Tests never contact TGJU; fixtures are frozen source excerpts. Research live requests are kept separate and rate-limited. The lockfile pins the SDK-compatible animation dependencies; root dev pins/overrides avoid npm installing newer incompatible peer copies.

### Live Market Verification Command

Run this command to independently verify ArzMan's parser against the live TGJU public pages:

```powershell
npm run verify
```

This script fetches USD, EUR, AED, IQD from their official TGJU profiles, parses them with the same logic used in production, and prints a detailed comparison report showing:
- Raw TGJU value and unit (IRR/IRT)
- Quote lot size
- Normalized Toman price
- Full normalization math
- Daily change, high/low, timestamps
- Stale flag status
- OK/FAIL verdict per currency

Example output:
```
Currency:          USD — دلار آمریکا
TGJU raw value:    2,306,000 IRR
Quote size:        1 unit
ArzMan Toman:      230,600 Toman
Normalization:     2,306,000 IRR / 10 / 1 = 230,600 Toman
...
Status:            ✅ OK
```

This command is **not** a mandatory CI test—it is an explicit developer/audit tool. It never breaks CI when TGJU is temporarily unavailable; it simply reports the failure.

See [QA status](docs/QA.md), [TGJU research](docs/TGJU-RESEARCH.md), [TODO](TODO.md) and [HANDOFF](HANDOFF.md). The full original request is preserved in `docs/REQUEST.txt`. Update HANDOFF.md before ending future coding sessions.

---

### Step-by-Step: Run ArzMan on Your iPhone (Windows Host)

**Prerequisites on Windows:**
1. Install Node.js 24 LTS from [nodejs.org](https://nodejs.org/)
2. Install Git for Windows
3. (Optional for EAS) Create free account at [expo.dev](https://expo.dev/)

**On your iPhone:**
1. Install **Expo Go** from the App Store (free)
   - Must support SDK 57 — check the installed version runs Expo 57+ apps

**Launch on Windows:**

```powershell
# 1. Open PowerShell in the project folder
cd D:\MY_APP\Arz_Man

# 2. Install dependencies (once)
npm ci

# 3. Start the Cloudflare Worker backend (Terminal 1)
npm run server
# Wait for: "Listening on http://0.0.0.0:8787" (or similar)

# 4. Configure the mobile app backend URL (Terminal 2, one-time setup)
Copy-Item apps/mobile/.env.example apps/mobile/.env.local
notepad apps/mobile/.env.local
# Edit EXPO_PUBLIC_API_URL to your PC's LAN IP, e.g.:
# EXPO_PUBLIC_API_URL=http://192.168.1.100:8787
# Save and close Notepad

# 5. Start Expo Metro bundler (Terminal 2)
npm run start -w @arzman/mobile -- --go
# A QR code will appear in the terminal
```

**Connect your iPhone:**
1. Ensure iPhone and Windows PC are on the **same Wi-Fi network** (not guest/isolated)
2. Open iPhone **Camera app** and scan the QR code in the terminal
3. Tap the Expo Go notification to open the app

**Troubleshooting:**
- **QR code won't open / "Cannot connect"**: Windows Firewall is blocking Metro (port 8081) or the Worker (port 8787). In Windows Defender Firewall, allow both Node.js and wrangler for **Private networks** only.
- **"Network request failed"**: The `EXPO_PUBLIC_API_URL` IP is wrong. Run `ipconfig` on Windows, find your `IPv4 Address` under your Wi-Fi adapter, update `.env.local`, then restart Metro.
- **Metro tunnel required (no LAN access)**: Press `t` in Metro terminal to enable `exp.direct` tunnel. Note: **tunnel does not expose port 8787**. The backend must still be reachable via LAN or deployed to Cloudflare.
- **Blank white screen**: Check Metro terminal for red errors. Run `npm run check` in project root to verify code integrity.
- **Expo Go says "Unsupported SDK"**: Your installed Expo Go is too old/newer. Use EAS Development Build instead (see below).

**For Face ID, SecureStore, SF Symbols, Widgets, Live Activities — Use EAS Dev Build:**

```powershell
cd D:\MY_APP\Arz_Man\apps\mobile
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
# Wait for cloud build (~5-15 min), then install the .ipa via TestFlight or device link
# Run: npx expo start --dev-client  (scans QR with the installed dev build, not Expo Go)
```

---

### Verified Market Data Accuracy

Live verification against TGJU public pages (as of audit):

| Currency | TGJU Raw (IRR) | Quote Size | Normalized Toman | Normalization Formula |
|----------|----------------|------------|------------------|----------------------|
| **USD**  | 2,306,000      | 1 unit     | 230,600          | 2,306,000 ÷ 10 ÷ 1   |
| **EUR**  | 2,651,000      | 1 unit     | 265,100          | 2,651,000 ÷ 10 ÷ 1   |
| **AED**  | 627,880        | 1 unit     | 62,788           | 627,880 ÷ 10 ÷ 1     |
| **IQD**  | 1,479          | 1 unit     | 147.9            | 1,479 ÷ 10 ÷ 1       |

**IQD convention verified:** TGJU profile `price_iqd` explicitly quotes **price per 1 Iraqi Dinar** (not 100 or 1000). FAQ text confirms: «قیمت هر دینار عراق... ۱,۴۷۹ ریال». Quote size is strictly **1 unit**. Lot sizes are never inferred from magnitude.

Run `npm run verify` to reproduce this audit at any time.