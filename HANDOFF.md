# ArzMan Handoff & Architecture Status

**Project:** «ارز من» (ArzMan) — Personal Iranian Currency-Market iPhone Application  
**Platform:** iOS (Expo SDK 57, React Native 0.86, TypeScript, Expo Router)  
**Development Host:** Windows 11 Pro, Node.js 24 LTS, Git Bash  
**Design Reference:** Apple iOS 27 Liquid Glass / HIG Design System  
**Date of Handoff:** 2026-09-21  
**Project Version:** 0.2.0  
**Project Path:** `D:\MY_APP\Arz_Man`  
**Git HEAD:** `87b8b45` — `fix: harden TGJU normalization, 45s server refresh, financial precision`  
**Previous Commit:** `9886e04` — `feat: establish ArzMan v0.2 verified baseline`  

---

## 1. Exact Current State

- The application is a fully functional, type-safe, tested personal currency market iPhone application.
- All core business logic, schema validation, data fetching, local Keychain-based portfolio storage, and offline caches are operating and verified.
- The visual system has been upgraded to Apple's **iOS 27 Liquid Glass** design language:
  - Strict two-layer separation: Chrome/Controls (Liquid Glass) vs Content (Opaque/Readable).
  - True OLED black background in Dark Mode (`#000000`), crisp grouped system background in Light Mode (`#F2F2F7`).
  - Apple concentric curvature geometry implemented across all card and container hierarchies.
  - Floating Liquid Glass capsule tab bar with SF Symbols on iOS (and fallback icons on other platforms).
  - Apple Stocks-style interactive chart with touch scrubber, HUD, high/low markers, and zero fabricated price series.
  - Interactive converter with spring-animated swap action and tactile numeric inputs.
  - Portfolio dashboard with multi-asset allocation bar, average cost calculations, and Face ID biometric privacy gate.
  - Search and filter bar in the Market view.
- **Verification Status:** `npm run check` (typecheck + lint + 18/18 vitest tests) passes with zero errors and zero warnings. `npx expo export --platform all` compiles Web, iOS (Hermes bytecode), and Android (Hermes bytecode) cleanly with 0 errors.

---

## 2. Work Completed in This Session

1. **Lint & Baseline Repair:**
   - Fixed 4 unused variable errors in `apps/mobile/app/(tabs)/portfolio.tsx` (`removeId`, `setRemoveId`, `removeError`, `setRemoveError`).
   - Implemented interactive transaction removal with native confirmation dialog and error handling.
2. **Design System Foundations (`apps/mobile/src/design-system/`):**
   - Built `ArzManDesignSystem`: comprehensive iOS 27 Liquid Glass token architecture (`tokens.ts`).
   - Defined True OLED Black palette (`#000000`), Apple Light palette (`#F2F2F7`), subtle translucent glass materials (`glassRegular`, `glassClear`, `glassProminent`, `glassRim`, `glassSpecular`), restrained direction colors (Apple green `#30D158`, red `#FF453A`, amber `#FFD60A`).
   - Implemented `concentricRadius(outerRadius, padding)` helper ensuring nested radii visually match parent enclosures.
   - Defined Apple typography scale (displayHero, largeTitle, title1–3, headline, body, callout, subheadline, footnote, caption1–2) with tabular numbers support.
3. **Reusable UI Components & Glass Primitives (`apps/mobile/src/ui.tsx`):**
   - `GlassView` & `GlassContainer`: Native `expo-glass-effect` integration on iOS with `isLiquidGlassAvailable()`, graceful fallback to `BlurView` on other platforms with specular rim borders.
   - `GlassButton`: Full iOS 27 button hierarchy (prominent, regular, secondary, quiet) with spring press feedback and haptics.
   - `GlassIconButton`: Circular/compact Liquid Glass controls with active tint states.
   - `GlassSearchBar`: Floating capsule search input with Persian RTL alignment and clear action.
   - `GlassSegmentedControl`: Apple segmented control with smooth selection indicators and selection haptics.
   - `MarketHero`: Live benchmark overview featuring USD/Toman in 42pt bold tabular numbers, daily change badge, mini SVG sparkline, spread indicator, and quick actions.
   - `MarketChangeBadge`: Apple Stocks-style pill with directional chevron, percentage, and tinted glass backdrop.
   - `SpreadBar`: Miniature daily spread visualization showing price position between daily low and high.
   - `AppIcon`: Native SF Symbols on iOS (`SymbolView` from `expo-symbols`) with graceful fallback to `Ionicons` on Android/Web.
   - `Card`, `Screen`, `AmountInput`, `Price`, `MarketStatus`, `EmptyState` refined to iOS 27 standards.
4. **Application Screens Upgrades:**
   - `app/(tabs)/_layout.tsx`: Floating Liquid Glass capsule tab bar with specular rim highlight, elevated shadow, SF Symbols, and active tab indicators.
   - `app/_layout.tsx`: Modal formSheet presentation with Apple continuous corner radius (`sheetCornerRadius: 32`), sheet grabber, minimal back buttons, and bold title styling.
   - `app/(tabs)/index.tsx`: Upgraded Home dashboard with Hero Market Area, portfolio sneak-peek, major market currencies, watchlist, quick converter teaser, and transparent source disclosure.
   - `app/(tabs)/market.tsx`: Added live search (Persian names and English symbols), category filter segments (All vs Favorites), and currency rows with favorite toggle.
   - `app/(tabs)/converter.tsx`: Source and destination currency cards with concentric geometry, rotating spring swap button, live rate reference, and clipboard copy with haptics.
   - `app/currency/[code].tsx` & `src/chart.tsx`: Stocks-grade detail screen with interactive touch scrubber, observation timeline, statistics grid (High, Low, Previous Close, Lot/Unit, Source time), and action buttons.
   - `app/(tabs)/portfolio.tsx`: Apple Wallet-style asset summary, multi-asset allocation bar, average acquisition cost cards, unrealized/realized P&L, transaction deletion with prompt, and Face ID biometric lock.
   - `app/transaction.tsx`: Buy/Sell/Adjustment type selector, currency chips, live total cost preview, and tactile input fields.
   - `app/alerts.tsx`: Clean condition selectors, threshold inputs, alert status badges, and honest capability disclosures.
   - `app/custom-rates.tsx`: Personal broker/USDT rate entry, difference comparison with open market, and delete actions.
   - `app/(tabs)/more.tsx`: Grouped Apple Settings cards for units (Toman/Rial), appearance (Dark/Light/Auto), Persian digits, haptics, refresh interval, and cache clearance.
5. **Project Tracking Documentation:**
   - Maintained `TODO.md` and `CHANGELOG.md`.

---

## 3. Files Changed & Created

### Created
- `apps/mobile/src/design-system/tokens.ts` — Apple iOS 27 Liquid Glass tokens and concentric geometry.
- `apps/mobile/src/design-system/index.ts` — Design system export barrel.
- `TODO.md` — Active development milestone tracking.
- `CHANGELOG.md` — Version history of changes.

### Modified
- `apps/mobile/package.json` — Added `"expo-symbols": "~57.0.3"`.
- `apps/mobile/src/ui.tsx` — Comprehensive iOS 27 Liquid Glass component library.
- `apps/mobile/src/chart.tsx` — Stocks-style interactive bezier chart with touch scrubber HUD and gradient fill.
- `apps/mobile/app/_layout.tsx` — Navigation stack with formSheet presentations, sheet corner radius, and headers.
- `apps/mobile/app/(tabs)/_layout.tsx` — Floating Liquid Glass capsule tab bar with SF Symbols.
- `apps/mobile/app/(tabs)/index.tsx` — Home screen with MarketHero, watchlist, quick actions, portfolio glance.
- `apps/mobile/app/(tabs)/market.tsx` — Market screen with search, category filtering, and favorite toggles.
- `apps/mobile/app/(tabs)/converter.tsx` — Converter with spring swap animation, currency selectors, and live rates.
- `apps/mobile/app/(tabs)/portfolio.tsx` — Portfolio dashboard with allocation bar, P&L breakdown, and deletion handler.
- `apps/mobile/app/transaction.tsx` — Transaction creation modal with live total preview.
- `apps/mobile/app/currency/[code].tsx` — Detailed currency screen with statistics grid and action bar.
- `apps/mobile/app/alerts.tsx` — Alert creation and management screen.
- `apps/mobile/app/custom-rates.tsx` — Custom exchange rate management screen.
- `apps/mobile/app/(tabs)/more.tsx` — Apple-grade settings screen.
- `HANDOFF.md` — Updated with current state and verification results.

---

## 4. Tests Run & Verification Results

| Verification Step | Command | Result |
|---|---|---|
| Monorepo Typecheck | `npm run typecheck` (`tsc` on shared, server, mobile) | **PASSED** (0 errors) |
| Monorepo Lint | `npm run lint` (`eslint .`) | **PASSED** (0 errors, 0 warnings) |
| Vitest Unit Tests | `npm test` (`vitest run`) | **PASSED** (18/18 tests across 3 suites) |
| Full Workspace Check | `npm run check` | **PASSED** (579ms) |
| Expo Multiplatform Export | `npx expo export --platform all` | **PASSED** (Web bundle 2.4MB, iOS Hermes bytecode 3.9MB, Android Hermes bytecode 4.2MB) |

### Test Suites Details
- `packages/shared/src/domain.test.ts`: 7 tests passing (normalization, conversion math, portfolio weighted average cost, realized/unrealized P&L, alerts matching, decimal parsing).
- `server/test/cache.test.ts`: 3 tests passing (Durable Object caching, last-known-good protection on failure, stale flag attachment).
- `server/test/parser.test.ts`: 8 tests passing (TGJU HTML parsing for USD, EUR, AED, IQD, quote size validation, FAQ cross-check, sanity bounds).

---

## 5. Current Bugs

- **Zero known functional bugs or crashes** in the codebase.
- No compile or bundling warnings.

---

## 6. Known Limitations & Honest Disclosures

1. **Source Timestamps:** Current public TGJU pages expose date labels (e.g. `۲۹ شهریور`) without a full ISO trade timestamp or trade year. The parser deliberately flags `sourceTimestamp: null` and marks quotes `stale: true` until an authoritative full ISO timestamp is available. Quotes must never be claimed as exchange closing prices.
2. **No Background Push Server:** Background price alerts while the app is suspended require server-side subscription infrastructure and Apple Push Notification Service (APNs) credentials. The current app reliably evaluates alerts during foreground app sessions.
3. **No Fabricated History:** Historical series show only legitimate observations collected by our backend. Shorter timeframes (1H, 1D) populate as the server runs; no fake past candlesticks are synthesized.
4. **USDT Feed:** USDT does not have an automated TGJU scrape feed. It is supported via user-entered manual custom rates (`custom-rates.tsx`) and explicitly labeled as manual.
5. **Physical iOS Face ID Testing:** Biometric authentication requires an EAS development build or physical iPhone; Expo Go on web/desktop simulator bypasses native Face ID prompts.

---

## 7. Current Market-Data Method

```text
Physical iPhone / Expo Mobile App
               │
               ▼ (HTTP GET /api/market, app polls every 30-300s user-configurable)
Cloudflare Worker (ArzMan Market Service)
               │
               ▼
Durable Object (`MarketStore`, SQLite backed)
  - 45-second cooldown between source scrapes (target 30-60s)
  - Exponential backoff on failures: 15s → 30s → 60s → 120s → 240s → 300s cap
  - Consecutive-failure counter persisted in storage
  - Serves cached last-known-good snapshot to all connected clients
  - Request coalescing: concurrent requests share one in-flight refresh
  - Stores validated observations in SQLite table `observations`
               │
               ▼ (Public HTTPS fetch, 12s timeout, 2MB cap)
TGJU Public Profile Pages (tgju.org)
  - USD: /profile/price_dollar_rl
  - EUR: /profile/price_eur
  - AED: /profile/price_aed
  - IQD: /profile/price_iqd
```

**Live TGJU verification audit (2026-09-21, via `npm run verify`):**

| Currency | TGJU Raw (IRR) | Quote Size | Normalized Toman | Status |
|----------|----------------|------------|------------------|--------|
| USD      | 2,306,000      | 1 unit     | 230,600          | ✅ OK  |
| EUR      | 2,651,000      | 1 unit     | 265,100          | ✅ OK  |
| AED      | 627,880        | 1 unit     | 62,788           | ✅ OK  |
| IQD      | 1,479          | 1 unit     | 147.9            | ✅ OK  |

---

## 8. TGJU Parser Details

- **Location:** `server/src/providers/tgju/index.ts`
- **Unit Normalization:**
  - Raw values are quoted in Rial (`IRR`) or Toman (`IRT`).
  - Unit is extracted from `واحد پولی` row.
  - Per-unit quote evidence is verified from the FAQ section (`در حال حاضر قیمت هر...`).
  - **IQD quote convention verified live:** TGJU profile `price_iqd` explicitly quotes the price of **one (1) Iraqi Dinar** in Rials. FAQ text confirms: «قیمت هر دینار عراق... ۱,۴۷۹ ریال». Quote size is strictly **1 unit**. Lot sizes (100 or 1000) are never inferred from magnitude. Example: 1,479 IRR = 147.9 Toman per 1 IQD.
  - Normalized formula: `priceToman = rawValue / (rawUnit === "IRR" ? 10 : 1) / quoteSize`.
- **Validation & Fault Tolerance:**
  - Primary price extracted from `[data-col="info.last_trade.PDrCotVal"]`.
  - Fallback table price extracted from `نرخ فعلی`.
  - Both sources, along with FAQ price, must agree.
  - Sanity bounds: USD/EUR/AED must be between 100 and 1,000,000,000 Toman; IQD between 0.1 and 1,000,000 Toman.
  - Malformed or unreachable scrapes never overwrite the last-known-good cache.
- **Unit Conventions (verified live, 2026-09-21):**
  - **USD:** raw in IRR, quote size 1 → 1 USD = `rawValue/10` Toman
  - **EUR:** raw in IRR, quote size 1 → 1 EUR = `rawValue/10` Toman
  - **AED:** raw in IRR, quote size 1 → 1 AED = `rawValue/10` Toman
  - **IQD:** raw in IRR, quote size 1 → 1 IQD = `rawValue/10` Toman (e.g., 1,479 IRR = 147.9 Toman)

---

## 9. Deployment State

- **Cloudflare Worker:** Ready for deployment via `npx wrangler deploy` in `server/`. Configured with Durable Object binding (`MarketStore`) on SQLite storage.
- **Environment:** `EXPO_PUBLIC_API_URL` configured in `apps/mobile/.env.local`.

---

## 10. Expo State

- **SDK:** Expo 57.0.24, React Native 0.86.3, React 19.2.3.
- **Bundler:** Metro, Expo Router v57.
- **Plugins:** `expo-router`, `expo-secure-store`, `expo-sqlite`, `expo-local-authentication`, `expo-build-properties` (with `enableSceneSupport: true`).
- **Export Test:** `npx expo export --platform all` succeeds cleanly.

---

## 11. EAS State

- **Configuration:** `apps/mobile/eas.json` defines `development`, `preview`, and `production` profiles.
- **Bundle Identifier:** `com.arzman.personal`.
- **Requirements for Build:** Remote cloud build with EAS CLI (`npx eas-cli@latest build --platform ios --profile development`). Local Mac/Xcode is not required on Windows.

---

## 12. Next Highest-Priority Task for Future Sessions

1. **Deploy Cloudflare Worker:** Run `wrangler login` and `npm run deploy` from `server/` to launch the live market backend on Cloudflare. This is the highest-priority next task, because it replaces the local LAN-based backend URL in `.env.local` with a permanent HTTPS endpoint reachable from anywhere.
2. **EAS Development Build:** Run `eas build --platform ios --profile development` to generate an ad-hoc or internal development build for physical iPhone testing with native Face ID and Liquid Glass.
3. **Widget & Live Activity Implementation:** Using the contracts in `apps/mobile/src/native-capabilities.ts`, build an iOS WidgetKit extension (shared App Group container for top 4 currencies) and ActivityKit dynamic island tracker.
4. **Push Notification Worker:** Connect Expo Server SDK or Cloudflare queues to evaluate price alert rules server-side and dispatch remote push notifications when the app is closed.

---

## 13. Verification Command Summary (npm run verify)

Run from project root on Windows:

```powershell
npm run verify
```

This command independently audits the ArzMan TGJU parser against the actual live public TGJU profile pages for USD, EUR, AED, IQD. It prints:
- Raw TGJU value and unit (IRR or IRT)
- Quote lot size (explicitly, never guessed)
- Normalized Toman price with full math shown
- Daily change, high/low, timestamps
- Stale flag status
- OK/FAIL verdict per currency
- Audit summary table at the end

This is **not** a mandatory CI test. It never breaks CI when TGJU is temporarily unavailable; it simply reports the failure. Run it explicitly when auditing market data correctness. Documented in README.md under "Live Market Verification Command".
