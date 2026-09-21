# Changelog — ArzMan (ارز من)

All notable changes to this project will be documented in this file.

## [0.3.1] - 2026-09-22 — engineering audit, market-data correctness, iPhone readiness

Continues and completes the previous agent's unfinished audit. Full detail in
[`docs/engineering-audit.md`](docs/engineering-audit.md).

### Fixed
- **P0 — live quotes were being rejected.** The TGJU parser required the page's FAQ
  sentence to quote exactly the same number as the live quote table. TGJU renders that FAQ
  from a slower cache, so during trading hours it legitimately lags — and the parser threw,
  failing the **entire** four-currency snapshot and leaving the app on a stale cache. The
  FAQ is now treated as what it is: evidence that the page quotes **one unit** and in which
  unit. It must exist, its unit must match the table, and its number must agree in
  magnitude (×0.5–×2) — a lag differs by percents, a lot-size or decimal regression by 10×,
  so that regression class is still caught. The previous close became a second magnitude
  anchor for the quote, the only one left when TGJU omits the daily high and low.
- **P1 — price alerts could never fire.** `alertMatches` gated on `isStale`, which is
  permanently true for TGJU because the page publishes a clock-only label that never
  establishes a trade time. The two ideas are now separate: `isStale` still answers "can we
  vouch for the trade time" for the status pill, and the new `isFetchFresh` answers "did we
  read this price recently", which is what acting on a price actually requires. A cache
  served after an upstream failure keeps its original `fetchedAt`, so it ages out instead of
  passing as live.
- **P1 — accounting precision.** Cost basis and average cost were rounded to two decimals
  after every transaction, so a repeating weighted average drifted further from the truth
  with each trade. Precision is now kept between transactions and rounded only for display.
- **P2 — the display unit was ignored by the portfolio.** Selecting Rial changed the market
  screens but left the portfolio total, open and realised P&L, daily change, per-holding
  value, average cost and the home converter teaser in Toman under a Rial heading. Number
  and label now move together on every surface. The transaction ledger and the manual-rate
  form stay in Toman and say so, because that is the unit the amounts were entered in.
- **P2 — a missing rate is now explained**, naming the currency and pointing at «نرخ من»,
  instead of rendering a bare dash. A manual rate fills an absent quote for any held asset
  rather than only USDT, which also makes the custom-rate screen's own description true.
  A live market quote still always wins.
- **P2 — deleting a transaction** now erases its Keychain item. The ledger index is still
  committed first, so the erase can never strand the ledger.
- **P3** — Persian digits for the quote size on the currency detail screen.

### Added
- `docs/engineering-audit.md` — findings by severity, the parser's validation model, live
  TGJU readings, the portfolio lifecycle walk-through, local-vs-deployed backend parity, the
  Expo Go compatibility matrix, network topology, security review and verification results.
- `scripts/audit-api.ts` — read-only smoke test of every public API route against any base
  URL, so a local Worker and a deployed one can be compared instead of guessed at.
- `totalValuation` and `isFetchFresh` in `@arzman/shared`.
- A `portfolio lifecycle` test suite: empty, buy, second buy, partial sell, full close,
  adjustment, overselling, awkward prices, long trade runs, a missing rate, a manual rate.
  **35 tests** in total, up from 24.

### Documentation
- **The README's iPhone instructions were wrong and are corrected.** Expo Go on iOS is no
  longer a free App Store install, and every build that runs on a physical iPhone requires a
  paid Apple Developer account for signing — on Windows as much as on macOS. The guide now
  gives one route, the EAS development build, with the prerequisite stated up front.
- The compatibility matrix was rebuilt from each library's own SDK 57 page. Previous claims
  that Expo Go lacks Keychain, Face ID and SF Symbols were wrong; all three are included.
  What Expo Go really cannot do for this project is apply `ios.enableSceneSupport` or carry
  the app's own identity and Persian Face ID string.
- Documented that the **deployed Cloudflare Worker is behind this repository** and what that
  costs. Nothing was deployed.

### Known and deliberate
- The market status pill reads «متصل · تازگی منبع تأیید نشده» even for seconds-old data.
  TGJU publishes no trade timestamp, so ArzMan refuses to claim one. This is honesty, not a
  bug; `sourceTimestamp` stays `null` and `stale` stays `true`.

## [0.3.0] - 2026-09-21 — Apple HIG / Liquid Glass UI redesign

### Added
- **Currency icon system (`apps/mobile/src/design-system/currency-icons.ts`):**
  one consistent squircle badge family for USD `$`, EUR `€`, AED `د.إ`, IQD `ع.د`
  (plus USDT/IRT/IRR) — four sizes, three tones (tint/filled/neutral), Apple
  system tints, per-glyph RTL/LTR direction, dark/light aware, reusable via
  `CurrencyBadge`/`CurrencyIcon`.
- **Modular UI kit (`apps/mobile/src/components/*`, re-exported by `src/ui.tsx`):**
  - `theme.ts` — `useTheme`, `useFeedback` (selection/impact/notification haptics),
    `usePressFeedback` (spring press states), `useReduceMotion` (reads the system
    Reduce Motion switch), `textStyle` (Apple Dynamic Type names).
  - `primitives.tsx` — `AppIcon` (SF Symbols on iOS via `expo-symbols`, Ionicons
    elsewhere), `Label` (Dynamic Type variants + tabular figures), `Divider`, `IconTile`.
  - `surfaces.tsx` — `Glass` (Liquid Glass chrome with honest blur fallback),
    `GlassContainer`, opaque `Surface`/`Card`, `GroupedList` with inset hairline
    separators, `SettingsRow`, `SwitchRow` (iOS Settings hierarchy).
  - `controls.tsx` — `Button` with Apple's semantic styles (`prominent`, `tinted`,
    `bordered`, `glass`, `plain`, `destructive`), sizes 50/44/34pt, capsule shape in
    horizontal rows, ≥44pt hit regions; `IconButton`; `SegmentedControl` with a
    traveling selection indicator; `SearchField` (36pt, magnifier + clear).
  - `market.tsx` — `Price`, `usePrice`, `ChangePill`, `RangeMeter`, `MarketStatus`,
    `MarketHero`, `CurrencyRow`, `CurrencyList`.
  - `screen.tsx` — `Screen` (safe areas + floating tab-bar clearance), `Section`,
    `EmptyState`, `AmountInput`.
- **Design tokens:** Apple system colors for dark/light, OLED `#000000` background,
  semantic control fills, `borderCurve: "continuous"` token, concentric geometry
  presets, 8pt spacing grid, 4 shadow elevations, 5 spring presets, motion durations.
- **Floating tab bar:** 58pt Liquid Glass capsule with specular hairline, always
  visible labels, quiet accent selection, selection haptics, RTL-mirrored order.

### Changed
- All screens rebuilt on the new kit: Home, Markets, Converter, Portfolio, More,
  Currency Detail, Alerts, Custom Rates, Transaction, plus chart polish.
- Market content is now rendered on **opaque** surfaces; Liquid Glass is used only
  for chrome (tab bar, glass buttons, icon buttons) per HIG · Materials.
- Money values use tabular figures and dominate their labels; high/low moved to
  secondary metadata lines.
- Lists use iOS inset-grouped rows with inset separators instead of per-item cards.

### Removed
- The decorative, **fabricated sparkline** in the Home hero. It was replaced by
  `RangeMeter`, which plots only the source-reported daily low/high/current.

### Fixed
- The broken uncommitted token refactor from the previous session (21 TypeScript
  errors) — reconciled without discarding any of the intended architecture.
- Content could previously collide with the floating tab bar; `Screen` now reserves
  exactly `TAB_BAR.clearance(insetBottom)`.

### Verified
- `npm run check` — typecheck 0 errors, ESLint 0 errors/0 warnings, Vitest 22/22.
- `npx expo-doctor` — 21/21 checks passed.
- `npx expo export --platform all` — clean Web, iOS Hermes and Android Hermes bundles.

## [0.2.0] - 2026-09-21

### Added
- **ArzManDesignSystem (`apps/mobile/src/design-system/`):**
  - Apple iOS 27 Liquid Glass token architecture with OLED true black palette (`#000000`) and Apple system grouped light mode (`#F2F2F7`).
  - Concentric geometry utility (`concentricRadius`) ensuring parent and child components visually share related curvature.
  - Semantic typography scale with Persian RTL support and tabular numerals formatting.
  - Spring animation and haptic feedback constants.
- **Reusable UI Components & Glass Primitives (`apps/mobile/src/ui.tsx`):**
  - `GlassView` & `GlassContainer`: Native `expo-glass-effect` integration with specular rim highlight and fallback for non-iOS platforms.
  - `GlassButton`: iOS 27 button hierarchy (`prominent`, `regular`, `secondary`, `quiet`) with spring scale interaction and haptics.
  - `GlassIconButton`: Circular/compact Liquid Glass controls.
  - `GlassSearchBar`: Floating capsule search input with Persian RTL alignment and clear action.
  - `GlassSegmentedControl`: Apple-style segmented control with smooth selection indicators.
  - `MarketHero`: High-end live benchmark overview card with USD/Toman showcase, daily change badge, mini SVG sparkline, spread indicator, and quick actions.
  - `MarketChangeBadge`: Apple Stocks-style pill with directional chevrons and tinted glass backdrops.
  - `SpreadBar`: Miniature daily spread visualization displaying price position between daily low and high.
  - `AppIcon`: Native SF Symbols on iOS via `expo-symbols` with graceful `Ionicons` fallback on Android/Web.
- **Enhanced Screens:**
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
- **Dependencies:** Added `"expo-symbols": "~57.0.3"` to `apps/mobile/package.json`.

### Fixed
- Fixed 4 unused variable lint errors in `apps/mobile/app/(tabs)/portfolio.tsx` (`removeId`, `setRemoveId`, `removeError`, `setRemoveError`).
- Implemented interactive transaction removal with native confirmation dialog and error handling.
- Fixed style prop types across UI components to support `StyleProp<ViewStyle>` and `StyleProp<TextStyle>`.

### Verified
- `npm run typecheck` (zero TypeScript errors across packages/shared, server, and apps/mobile).
- `npm run lint` (zero ESLint errors or warnings).
- `npm test` (18/18 tests passing in Vitest).
- `npx expo export --platform all` (clean multiplatform bundle export for Web, iOS, Android).
