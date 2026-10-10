# ArzMan Handoff & Architecture Status

## Latest: taste-skill review and Android APK (2026-10-04)

Read `docs/taste-skill-audit.md` first for current source/runtime/build evidence.
Android distribution now uses the existing EAS project's internal preview APK
profile, package `com.arzman.personal`, and the verified deployed HTTPS API.
The old iPhone-only status and backend outage notes below are historical.
Current checks: typecheck/lint, 46 tests, Doctor 21/21, all-platform export,
14/14 deployed API smoke checks and 4/4 real TGJU verification.
Scoped fixes: converter tap targets/safe-area/reduced motion/narrow amount
display; platform-neutral settings copy; native appearance support and compatible
Expo patches. Portfolio remains removed. No Android device is connected, so
physical native QA must follow installation. Build completion/signature and
distribution file are recorded in the audit. EAS job
`47f81330-8859-4b34-ac22-fc4eff1a748b` finished successfully on 2026-10-04;
the direct APK link and Persian installation guide are in the current audit.

**Project:** «ارز من» (ArzMan) — Personal Iranian Currency-Market iPhone Application  
**Platform:** iOS (Expo SDK 57, React Native 0.86, TypeScript, Expo Router)  
**Development Host:** Windows 11 Pro, Node.js 24 LTS, Git Bash  
**Design Reference:** Apple iOS 26/27 Liquid Glass + Human Interface Guidelines  
**Date of Handoff:** 2026-09-22 (updated after the engineering-audit session)  
**Project Version:** 0.3.1  
**Project Path:** `D:\MY_APP\Arz_Man`  
**Git HEAD at the redesign handoff:** `8900c9d`  
**Git HEAD after the audit session:** see §00.4

> Read **§00000, §0000, §000 and §00 first** — it is the most recent session and supersedes anything older it
> contradicts, in particular the Expo Go instructions in §0 and in `README.md`.

---

## 00000. Professional redesign (2026-09-27)

- Commits `aebc8e6` (Vazirmatn typography) and `7b33768` (brand redesign).
  See CHANGELOG 0.5.0 for the full list.
- **Design rules to keep:** all text through `Label` (it applies
  `persianText`: Vazirmatn family by weight, line height ≥ 1.5625×, no
  tracking on Persian); fills behind white text use `accentSolid`, never
  `accent`; one brand surface (`QuoteHero`) per screen; sparklines only from
  real observations (`useHistory`, cached 5 min — each call costs DO rows).
- Verified in the web runtime at 393×852, dark and light. Native-only effects
  (Liquid Glass tab bar over the new palette, Reanimated on-device, SF Symbols)
  still need the owner's eyes on the iPhone.
- Tests 43/43; iOS Hermes export builds (4.9 MB); expo-doctor 20/21 (the same
  upstream patch-release advisory).

---

## 0000. Portfolio removed; deployed backend down (2026-09-27)

- The owner asked to remove «دارایی من» completely. Done: tab, screens,
  transaction sheet, home summary, detail action, biometric lock and `privacy`
  setting, `expo-local-authentication`, `expo-secure-store`, and the shared
  portfolio domain + its tests. The app is now market · converter · alerts ·
  personal rates. Last commit that still had the portfolio: `41adbc9`.
- Tests 23/23, typecheck and lint clean, iOS Hermes export builds, expo-doctor
  20/21 (the same upstream patch-release advisory as before).
- **Deployed Worker 503 — cause found and fixed (`4745059`), not yet deployed.**
  The retention delete scanned the whole observations table every refresh
  (measured: 40,000 rows read per run → 8 after the fix), exhausting the Free
  plan's 5M rows-read/day ~90 min after each 00:00 UTC reset. Also added an
  idle refresh cadence. Deploy: `npm run deploy -w @arzman/server` (Wrangler is
  already signed in on this PC; dry run passes). See CHANGELOG 0.4.1.

---

## 000. First on-device pass (2026-09-27)

ArzMan runs on the owner's iPhone through **Expo Go** (free App Store build,
signed in to the same Expo account as the CLI — Expo Go requires that on a
physical iOS device). The owner judged the UI weak and asked for flags; this
session fixed what was visible on the phone. See CHANGELOG 0.3.2 for the list.

- Commits: `561a8fe` (flags), `5daef79` (anomalies), plus this docs commit.
- Tests 36/36, typecheck and lint clean, iOS Hermes export builds.
- `expo-doctor` 20/21: five Expo **patch** releases appeared upstream; not
  caused by this work, deliberately not upgraded mid-UI-change.
- How it was verified: web runtime at 393×852, dark and light, with sample
  holdings; RTL order measured from DOM glyph rects. Native-only surfaces
  (Liquid Glass, SF Symbols, the tab-bar fade over real glass) still need the
  owner's eyes on the phone.
- The blue gear / grey edge chevron on the phone are Expo Go's dev overlay.
- **Next:** owner reloads the app on the phone and reports remaining issues.

---

## 00. Engineering audit & iPhone readiness (2026-09-22)

Full detail lives in **`docs/engineering-audit.md`**. This is the summary a next agent needs.

### 00.1 Where the previous agent stopped

The previous agent (GPT-6 Astra) hit its usage limit mid-session. Its work was **all
uncommitted** in the working tree and has been preserved, finished and committed — nothing
was discarded or redone:

- `packages/shared/src/index.ts` — removed the per-transaction rounding that was corrupting
  a repeating weighted average; added `totalValuation` so a missing price makes the total
  unknown instead of zero; `valuation` returns zero for a closed position.
- `packages/shared/src/domain.test.ts` — two new tests for the above.
- `apps/mobile/*` — Rial/Toman labelling fixed on the currency-detail statistics; `—` and a
  neutral tone instead of a fabricated loss when a rate is missing; a USDT manual-rate
  fallback; chart HUD decimals; an unmount guard in the chart effect; an honest web-storage
  notice on the portfolio screen.
- `server/src/index.ts` — history range lookup switched to `Object.hasOwn`.
- `package-lock.json` — synced for `tsx` and `expo-symbols` (verified: no other upgrades).
- `scripts/audit-api.ts` — new read-only API smoke test.

It had **not** finished: the TGJU FAQ problem it identified was still only diagnosed (the
equality gate was still in the parser), the portfolio edge cases were only partially walked,
and nothing was documented or committed.

### 00.2 What this session completed

1. **P0 — TGJU FAQ gate removed properly.** The parser no longer requires the FAQ number to
   equal the live quote; it requires the FAQ to _exist_ (per-unit evidence), to publish the
   same unit, and to agree in magnitude (×0.5–×2). Added the previous close as a second
   magnitude anchor. `docs/engineering-audit.md` §2 has the full validation model.
2. **P1 — price alerts were unreachable** and now work: `alertMatches` gates on the new
   `isFetchFresh` (did we read this price recently) instead of `isStale` (can we vouch for
   the trade time), which is permanently true for TGJU.
3. **P2 — display unit** now applies to the whole portfolio dashboard and the home teaser,
   not just the market screens.
4. **P2 — missing rates** are explained in the UI and any asset's manual rate now fills an
   absent quote; the custom-rate screen's description was corrected to match.
5. **P2 — deleted transactions** are now erased from the Keychain, after the ledger index
   commit so the ledger can still never be stranded.
6. Portfolio edge cases A–H finished as permanent tests **and** re-walked by hand in the
   running app; offline fallback re-verified at runtime.
7. Backend parity measured; Expo Go reality checked against the current official docs.

### 00.3 Current status

- **Tests:** 35/35 in 3 files. `npm run typecheck` ✅, `npm run lint` ✅, `npx expo-doctor`
  21/21 ✅, `npx expo export --platform all` ✅.
- **Live TGJU (2026-09-22 01:56 Tehran):** USD 230,800 · EUR 265,010 · AED 62,850 ·
  IQD 148.6 Toman. All IRR, quote size 1 unit, `sourceTimestamp: null`, `stale: true` —
  which is correct: TGJU publishes no trade timestamp, only a clock or day/month label.
- **Deployed Cloudflare Worker is OUT OF DATE.** It serves correct prices today, but it
  predates the P0 parser fix and still 503s on `?range=toString|__proto__|constructor`
  where this repository returns 400. **Nothing was deployed.** The command, for whenever the
  owner chooses: `npx wrangler deploy --config server/wrangler.jsonc`.
- **API URL mode:** `apps/mobile/.env.local` (git-ignored) points at the deployed HTTPS
  Worker. The local Worker on `:8787` is therefore **not** needed for iPhone testing.
- **Expo Go (corrected 2026-09-26):** no dependency in this project is incompatible with it —
  every native module used is in the Expo Go bundle, and `npx expo start --go` serves a
  working `exposdk:57.0.0` iOS bundle. Expo Go **is** a free App Store install
  (`id982107779`) and its current build runs React Native 0.86, this project's exact
  version. An earlier revision of this handoff claimed otherwise; that came from the
  `set-up-your-environment` docs page, which describes building a _private_ Expo Go with
  `npx eas-cli@latest go` — a different thing from the App Store build. `docs/engineering-audit.md`
  §5 records both sources.
- **Development build:** the docs state that _all_ builds running on an iPhone device require
  a paid Apple Developer account for signing, on macOS, Windows and Linux alike. This is the
  upgrade path, not the entry point — take it when the app's own identity, the Persian Face
  ID string, `ios.enableSceneSupport` or a native extension is needed.
- **iPhone readiness:** ready, and reachable **for free** through Expo Go. The owner has
  already run `eas login` and `eas init` (an EAS `projectId` and `owner` are now in
  `apps/mobile/app.json`, currently uncommitted) and enabled Developer Mode on the phone, so
  Route B is also open to them the moment they want it.
- **Next task:** run the app in Expo Go on the owner's iPhone and complete the on-device QA
  checklist in `TODO.md`.

### 00.4 Commits from this session

```
8e4cc32 chore: sync lockfile and add a read-only API audit script
5e05e9e fix(market): stop rejecting live quotes over a lagging TGJU FAQ
6bd7cfb fix(shared): keep accounting precision and make price alerts reachable
4945550 fix(mobile): honour the display unit everywhere and explain missing rates
<this>  docs: record the engineering audit and correct the iPhone route
```

HEAD is that last docs commit — run `git log --oneline -6` for its hash; it is not written
here because writing it would change it. The four fix/chore hashes above are stable. The
working tree is clean apart from the untracked, local-only `.claude/` agent settings, which
were deliberately not committed.

---

## 0. UI Redesign Handoff — Claude → Cline (2026-09-21)

### 0.1 What Claude had completed before the handoff

Claude's session produced (all committed through `d56dae8`):

- The v0.2 verified baseline: working app, 45s server refresh hardening, `npm run verify` audit.
- A first design-system pass (`apps/mobile/src/design-system/tokens.ts`) and a large
  `apps/mobile/src/ui.tsx` component library with native `expo-glass-effect` integration.
- Screen upgrades: floating tab bar, formSheet modals, home hero, market search,
  converter, currency detail + chart, portfolio, alerts, custom rates, settings.
- Three _uncommitted_ files found at handoff:
  - `docs/apple-references/apple-reference-index.md` (new)
  - `docs/apple-references/apple-ui-findings.md` (new)
  - `docs/ui-audit.md` (new)
  - `apps/mobile/src/design-system/tokens.ts` (**modified, and left broken**: the
    rewrite renamed/removed `concentricRadius`, `lineSubtle`, `redGlass`, `greenGlass`,
    `redText`, `greenText`, `amberText`, `accentGlass`, `glassClear`, `surfaceHover`
    while screens still referenced them → 21 TypeScript errors).

### 0.2 What Cline completed in this session

1. **Recovered Claude's work** — kept the new token architecture, extended it with
   the missing semantic tokens (`fillPrimary…fillQuaternary`, `lineSubtle`, tint
   fills, legacy aliases) and re-exported `concentricRadius`. No work was discarded.
2. **Rebuilt the UI kit as modules** (the single 1,500-line `ui.tsx` became a thin
   barrel over `src/components/*`, so all screen imports kept working):
   - `theme.ts` — `useTheme`, `useFeedback` (haptics), `usePressFeedback` (spring
     press states), `useReduceMotion` (system Reduce Motion), `textStyle`.
   - `primitives.tsx` — `AppIcon` (SF Symbols ⇄ Ionicons), `Label` (Dynamic Type
     variants), `Divider`, `IconTile`.
   - `surfaces.tsx` — `Glass` (Liquid Glass chrome, honest fallback), `GlassContainer`,
     opaque `Surface`/`Card`, `GroupedList` (inset hairline separators), `SettingsRow`,
     `SwitchRow`.
   - `controls.tsx` — `Button` (prominent/tinted/bordered/glass/plain/destructive,
     50/44/34pt, capsule-in-rows), `IconButton`, `SegmentedControl` (traveling
     indicator), `SearchField`, `Choices`.
   - `market.tsx` — `Price`, `usePrice`, `ChangePill`, `RangeMeter` (replaces the
     fabricated sparkline), `MarketStatus`, `MarketHero`, `CurrencyRow`, `CurrencyList`.
   - `screen.tsx` — `Screen` (safe areas + tab-bar clearance), `Section`, `EmptyState`,
     `AmountInput`.
3. **Currency icon system** — `src/design-system/currency-icons.ts`: one consistent
   badge family (squircle, continuous corners, 4 sizes, 3 tones, semantic Apple
   tints, per-glyph RTL/LTR direction). Used on home, market, detail, converter,
   portfolio, alerts and custom rates.
4. **Redesigned every screen**: tab bar, home, market, converter, portfolio, more,
   currency detail, alerts, custom rates, transaction, chart polish.
5. **Verification**: `npm run check` green (typecheck + lint + 22 tests),
   `npx expo-doctor` 21/21, `npx expo export --platform all` clean.

### 0.3 Current UI state

- Dark/OLED-first (`#000000`), Apple light mode (`#F2F2F7`), both fully themed.
- Glass is chrome-only (tab bar, glass buttons, icon buttons); market content is opaque.
- All containers use native `borderCurve: "continuous"` squircles.
- Buttons follow Apple's semantic hierarchy; one prominent CTA per view.
- Lists are iOS inset-grouped (rows + inset hairlines), not card grids.
- RTL mirrored throughout (leading = right); currency glyphs never mirrored.
- Tab bar order is mirrored for Persian reading order (خانه on the right).

### 0.4 Apple references used

See `docs/apple-references/apple-reference-index.md` (12 official sources, each with
URL and the design decision it grounds). The official "View Markdown" data endpoint
is documented there and was used for HIG pages.

### 0.5 Remaining visual issues

Listed in `docs/ui-audit.md` § "Remaining known visual debt" — notably: glass
fallbacks on web/Android are approximations, the chart card still uses its own
padding, money values intentionally do not scale with Dynamic Type.

### 0.6 Exact test state & Git commits

- `npm run check` → typecheck ✅, lint ✅ (0 errors/0 warnings), vitest 22/22 ✅
- `npx expo-doctor` → 21/21 ✅
- `npx expo export --platform all` → Web + iOS + Android Hermes bundles ✅
- Commits created in this session (see `git log --oneline`): docs reference audit,
  design-system rebuild, currency badge system, screen redesign, docs update.

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

| Verification Step         | Command                                               | Result                                                                                  |
| ------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Monorepo Typecheck        | `npm run typecheck` (`tsc` on shared, server, mobile) | **PASSED** (0 errors)                                                                   |
| Monorepo Lint             | `npm run lint` (`eslint .`)                           | **PASSED** (0 errors, 0 warnings)                                                       |
| Vitest Unit Tests         | `npm test` (`vitest run`)                             | **PASSED** (18/18 tests across 3 suites)                                                |
| Full Workspace Check      | `npm run check`                                       | **PASSED** (579ms)                                                                      |
| Expo Multiplatform Export | `npx expo export --platform all`                      | **PASSED** (Web bundle 2.4MB, iOS Hermes bytecode 3.9MB, Android Hermes bytecode 4.2MB) |

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
| -------- | -------------- | ---------- | ---------------- | ------ |
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
