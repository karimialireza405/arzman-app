# ارز من · ArzMan

A Persian-first personal iPhone currency dashboard built on **Expo SDK 57, React Native 0.86, TypeScript and Expo Router**, developed on Windows. It reads Iranian open-market USD/EUR/AED/IQD quotes through a Cloudflare service. No paid market-data API key is required.

**Status:** source code, automated domain/parser/cache tests and JavaScript exports are available. Physical-iPhone QA, a signed EAS build and Cloudflare deployment have not been performed. The current TGJU pages do not provide a complete trade timestamp; quotes are deliberately marked stale/unverified. This is not a claim of production readiness.

## What is included

- Persian dashboard, markets, currency details, converter, watchlist, custom rates and dark/light/system appearance.
- **Apple-aligned UI kit** (`src/components/*` + `src/design-system/*`): Liquid Glass chrome
  (tab bar, glass buttons) with **opaque** content surfaces, native `borderCurve: "continuous"`
  squircles, semantic button hierarchy, segmented controls, iOS search field, inset-grouped
  lists, SF Symbols on iOS, spring press states, haptics and system Reduce Motion support.
- **Currency badge family** (`CurrencyBadge`): one consistent squircle icon system for
  USD/EUR/AED/IQD (+USDT/IRT) with semantic tints — no flags, no emoji.
- Native navigation sheets, safe-area layout (Dynamic Island, home indicator, floating tab bar).
- Rial/toman preferences, Persian/English number formatting and explicit source quote sizes.
- Local transactions, weighted average cost, realized/unrealized P&L, allocation, daily estimated change and device-authentication guards.
- Foreground-only threshold, percentage and rapid-movement alerts, disabled for stale prices.
- Real backend observation history across 1H/1D/1W/1M/3M/1Y, with touch selection and no generated price history.
- Shared schemas, parser fixtures, protected last-known-good cache and restart-persistent server history.

USDT is a separate provider contract; no live USDT feed is enabled. A user-entered USDT price is explicitly labelled manual. Widgets, Live Activities, Siri and background push are disabled typed adapters plus implementation documentation.

## UI design system (Apple HIG / Liquid Glass)

- Tokens live in `apps/mobile/src/design-system/` (`tokens.ts`, `currency-icons.ts`);
  components live in `apps/mobile/src/components/*` (barrel: `src/ui.tsx`).
- Material rule: **glass = chrome, content = opaque** (HIG · Materials).
- Buttons follow Apple's semantic hierarchy; the full mapping (and the official
  Apple sources behind every rule) is documented in `docs/apple-references/`
  and `docs/ui-audit.md` § "Post-Redesign Status".

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

Set `EXPO_PUBLIC_API_URL` to the **deployed HTTPS Worker URL**. `apps/mobile/.env.local` is already configured this way and is ignored by Git.

> There are two independent connections and they are easy to confuse. **Metro** (the JS bundle and fast refresh) is iPhone ↔ this PC over Wi-Fi. The **market API** is iPhone ↔ Cloudflare over HTTPS. Because the app points at the deployed Worker, **the local Worker on port 8787 is not needed for iPhone testing** — no LAN backend URL, no firewall rule for 8787, no App Transport Security problem. Run `npm run server` only when developing the backend itself, and point `.env.local` at `http://<your LAN IPv4>:8787` for that.

Start Expo:

```powershell
npm run start -w @arzman/mobile
```

Press `w` for a browser preview, or open [the local preview](http://localhost:8081). Environment changes require restarting Metro.

**Which runtime can run this app** — see the matrix below, and read [`docs/engineering-audit.md`](docs/engineering-audit.md) §5 before choosing. Short version: every native module this project uses *is* included in Expo Go, and Expo Go is a **free App Store install** whose current build runs React Native 0.86 — this project's exact version. So the free route works. Move to a development build when you need the app's own identity, the Persian Face ID string, `ios.enableSceneSupport`, or a native extension; that route requires a paid Apple Developer account for signing.

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

## Feature Compatibility Matrix

Verified on 2026-09-22 against each library's own page on `docs.expo.dev/versions/v57.0.0/sdk/`
("Included in Expo Go" is the badge shown there), and empirically: `npx expo start --go`
serves an `exposdk:57.0.0` manifest and a working iOS Hermes bundle for this project.

| Feature | Expo Web | Expo Go (iOS) | Development build | Notes |
|---------|----------|---------------|-------------------|-------|
| Market data, converter, alert logic | ✅ | ✅ | ✅ | Plain JS over an HTTPS API |
| Charts (`react-native-svg`) | ✅ | ✅ | ✅ | Bundled in Expo Go |
| Portfolio ledger | ⚠️ `localStorage` | ✅ Keychain | ✅ Keychain | |
| `expo-secure-store` | ❌ falls back | ✅ | ✅ | Included in Expo Go |
| `expo-sqlite` | ❌ falls back | ✅ | ✅ | Included in Expo Go |
| Face ID (`expo-local-authentication`) | ❌ | ✅ | ✅ | Included in Expo Go — but the prompt shows **Expo Go's** permission text, not ArzMan's Persian one |
| Liquid Glass (`expo-glass-effect`) | ❌ falls back | ✅ iOS 26+ | ✅ iOS 26+ | Included in Expo Go; plain view below iOS 26 |
| `expo-blur` | approximation | ✅ | ✅ | Included in Expo Go |
| SF Symbols (`expo-symbols`) | ❌ Ionicons | ✅ | ✅ | Included in Expo Go |
| Haptics (`expo-haptics`) | ❌ no-op | ✅ | ✅ | Every call site is guarded and `.catch()`-ed |
| `ios.enableSceneSupport` build property | n/a | ❌ not applied | ✅ | A config plugin cannot change Expo Go's prebuilt binary |
| App identity (name «ارز من», icon, bundle id) | n/a | ❌ Expo Go shell | ✅ | |
| Push notifications | ❌ | ❌ | ❌ | **Not implemented.** In-app alerts only, while the app is open |
| Widgets · Live Activities · Dynamic Island · Siri/App Intents | ❌ | ❌ | ❌ | **Not implemented** (`nativeCapabilities` are all `false`). Each needs a native extension target, therefore a development build |

## Data Privacy and Limitations

- Portfolio transactions remain on the device. iPhone stores each transaction as a small Keychain item; only its opaque ID index is in SQLite. Settings, watchlist, alerts, custom rates and market cache occupy separate keys. Cache clearing does not erase transactions.
- The browser preview uses localStorage and does **not** offer encrypted portfolio storage or device authentication. Use sample data there.
- The privacy switch guards portfolio/transaction screens and hides the home portfolio summary, relocking when backgrounded or when leaving the portfolio. Native Face ID, app-switcher snapshots and VoiceOver still require device QA. It is not a claim of a hardened encrypted wallet.
- There is no portfolio export/recovery flow yet; do not rely on this development build as your only transaction record.
- TGJU publishes no trade timestamp (only a clock or day/month label), so the status pill honestly reads «تازگی منبع تأیید نشده» and `sourceTimestamp` stays `null`. Alerts are evaluated against *retrieval* freshness instead, which ArzMan does know, so they fire while the app is open. There is no closed-app push delivery.
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

There are two routes. **Start with Expo Go** — it is free, takes about two minutes, and
every native module this project uses is included in it.

#### Route A — Expo Go (free, recommended first)

**On the iPhone:** install **Expo Go** from the App Store (free, `id982107779`). Its current
build runs React Native 0.86, which is this project's exact version.

**On Windows:**

```powershell
cd D:\MY_APP\Arz_Man
npm ci
npm run start -w @arzman/mobile -- --go
```

A QR code appears in the terminal. Open the iPhone **Camera** app, point it at the QR, and
tap the Expo Go banner. Keep both devices on the same private Wi-Fi (not a guest network,
no VPN). If Windows asks about the firewall, allow Node.js for **Private networks** only.

Market data arrives from the deployed HTTPS Worker over the internet, so **the local `:8787`
backend is not involved** and no LAN backend URL is needed.

What you give up in Expo Go, and only this: the app runs inside the Expo Go shell rather
than under its own name, icon and bundle id; the Face ID prompt shows Expo Go's permission
text instead of ArzMan's Persian one; and `ios.enableSceneSupport` is not applied, because a
config plugin cannot change Expo Go's prebuilt binary. Everything else — Keychain, Face ID
itself, SF Symbols, Liquid Glass, haptics, charts, the full portfolio — works.

#### Route B — EAS development build (when Expo Go is not enough)

Use this when you want the real app: its own identity, the Persian Face ID string, scene
support, or any future native extension (widgets, Live Activities, App Intents).

**Prerequisite:** an active [Apple Developer Program](https://developer.apple.com/programs/)
membership (US$99/year). The Expo docs state it for macOS, Windows and Linux alike — *all
builds that run on an iPhone device require a paid Apple Developer account for build
signing*. Also enable **Developer Mode** on the iPhone (Settings → Privacy & Security),
which iOS 16+ requires before it will run a development-signed app.

```powershell
cd D:\MY_APP\Arz_Manpps\mobile
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create
npx eas-cli@latest build --profile development --platform ios
```

`device:create` prints a registration link — open it **on the iPhone** and install the
profile. `build` then asks for your Apple ID, creates the signing credentials, and compiles
on EAS servers (10–20 minutes). No Xcode, no Mac. It ends with an install link and QR.

Afterwards, run the dev server with `npx expo start --dev-client` and open **ArzMan** on the
phone.

**Troubleshooting (both routes)**

- *The phone cannot reach Metro*: same private Wi-Fi, no VPN, Node.js allowed through
  Windows Defender Firewall for **Private networks**. Fallback: add `--tunnel`.
- *«ارتباط با سرویس برقرار نشد»*: that is the market API, not Metro. Check
  `EXPO_PUBLIC_API_URL` in `apps/mobile/.env.local` and restart Metro after any change.
- *Blank screen*: read the Metro terminal for red errors, then run `npm run check` at the
  repository root.
- *Build fails on signing (Route B)*: confirm the bundle id `com.arzman.personal` is free on
  your account, or change `ios.bundleIdentifier` in `apps/mobile/app.json`.

**Windows-only preview.** `npm run start -w @arzman/mobile` then `w` runs the app in a
browser. Useful for logic and layout, but **not** evidence of iPhone behaviour: no Keychain,
no Face ID, no SF Symbols, no Liquid Glass, no haptics.

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