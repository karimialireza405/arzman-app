# Changelog — ArzMan (ارز من)

All notable changes to this project will be documented in this file.

## [0.5.1] - 2026-09-27 — second design pass

### Changed
- **Converter**: two compact one-row cards with currency pills, a native
  currency sheet with live rates, a brand swap button and quick-amount chips.
- **Currency detail chart**: period change as a pill, compact scrub readout,
  violet for a flat series; the hero no longer repeats the trend.
- **Status line**: states when the rates were received, coloured by freshness,
  instead of a permanent amber "source time unknown".
- **Loading**: skeleton placeholders instead of bare dashes.

### Fixed
- The converter showed small results as **۰** (1 Toman = 0.0000043 USD);
  `formatAmount` keeps four significant digits.
- A failed font load rendered text in a serif / unknown family; the app now
  falls back to the system font.
- Opening the converter from Toman no longer starts as Toman → Toman, and
  picking the currency already on the other side swaps them.

## [0.5.0] - 2026-09-27 — professional redesign

References: Dribbble currency-exchange shots (Kites Design dark exchange UI,
card-per-row rate lists, Lumina) and the ui-ux-pro-max fintech guidance.

### Added
- **Vazirmatn** typography (OFL), applied to every string through `Label`.
- **Brand hero card** (`QuoteHero`) on Home and currency detail: indigo→violet
  gradient, today's trend, daily range, glass action chips.
- **Real sparklines** in every currency row, from stored observations only.
- Price-change tick, violet ambient light, staggered section entrance, tab
  shift transition. All respect Reduce Motion.

### Fixed
- **Text overflowing its frame («ارز من»)**: Persian needs 1.5625× line height
  (measured from the font files); the scale gave 1.2–1.35×. Enforced centrally.
- Letter-spacing on Persian text broke letter joins — dropped for Persian.
- White on the prominent button fill was 2.72:1 → new `accentSolid` (5.15 / 7.10).
- Currency detail repeated its name three times; sheets repeated their title.
- «درهم امارات» truncated on the market list.

### Design tokens
- Dark: base `#07080E`, surface `#11131E`, accent `#A78BFA` (text) /
  `#6D4AFF` (fills), gold `#F5B84B`. Light: base `#F4F5FA`, accent `#6D28D9`.
  All text pairs verified ≥ 4.5:1.

## [0.4.1] - 2026-09-27 — backend: stop exhausting the free Cloudflare budget

### Fixed
- **Root cause of the daily 503 outage, measured.** Every refresh ran
  `DELETE FROM observations WHERE timestamp < ?`, which cannot use the
  `(currency, timestamp)` primary key and scans the whole table. Measured in
  workerd with the cursor's billing counters on a 40,000-row table: **40,000
  rows read per run** (deleting nothing), against a Workers Free budget of
  5,000,000 rows read per day. The budget ran out ~90 minutes after each
  00:00 UTC reset and all storage then failed — which matches every
  observation (up 03:30–05:00 Tehran, down afterwards). The new predicate names
  the currencies: **8 rows read**. A test checks every statement's query plan.
- Refresh every 45 s only while a client asked within 10 minutes, every 10
  minutes otherwise (idle refreshes 1,920 → 144/day; TGJU loads 7,680 → 576/day).
- No alarm rewrite on every request; no redundant writes after a success.

### Estimated daily use afterwards
- App open 24/7: ~26k rows read (0.5 % of limit), ~21k rows written (21 %).

### Not done
- **Not deployed.** Deploying ships this and the earlier parser fixes. Today's
  budget is already spent, so the deployed API recovers at 00:00 UTC
  (03:30 Tehran) and should then stay up.

## [0.4.0] - 2026-09-27 — portfolio removed

### Removed (owner's request: «بخش دارایی من رو کامل حذف کن»)
- The «دارایی من» tab, the portfolio screen, the transaction sheet, the home
  portfolio summary and the «ثبت تراکنش در دارایی من» action on currency detail.
- The biometric privacy lock (it existed only to guard the portfolio) and its
  `privacy` setting. Settings saved by older versions still load: the schema
  strips the unknown key.
- `expo-local-authentication` and `expo-secure-store`, with their config
  plugins — nothing else used them. Lockfile change: those two packages only.
- The portfolio domain in `@arzman/shared` (`calculatePortfolio`, `valuation`,
  `totalValuation`, the transaction schema) and its 14 tests. Two IQD
  display-formatting assertions that lived among them were kept as a test.
- Everything is recoverable from git (`41adbc9` is the last version with it).

### Changed
- «نرخ من» now describes what it does without a portfolio: compare a personal
  rate with the market; a USDT rate is a note only.

### Not removed, deliberately
- Transactions an owner already entered on a phone stay dormant in that app's
  Keychain; nothing reads or shows them. They are not deleted automatically,
  because deletion cannot be undone.

### Found during verification — not caused by this change
- The **deployed** Worker answers `/health` but every Durable Object call,
  including the trivial `/api/market/XXX` → 404 path, returns
  `503 SERVICE_UNAVAILABLE`. TGJU itself is fine (`npm run verify` 4/4). This
  matches a Workers Free daily Durable Object limit being exhausted — Cloudflare:
  exceeding a free limit makes "further operations of that type fail with an
  error"; limits reset 00:00 UTC. Unconfirmed until someone with dashboard
  access checks the Worker's metrics. Nothing was deployed.

## [0.3.2] - 2026-09-27 — first on-device pass: flags and visual anomalies

The app ran on the owner's iPhone in Expo Go for the first time. Every issue
below was seen there, then reproduced and fixed at 393×852 in the web runtime.

### Added
- **Round country flags** for every currency (🇺🇸 USD, 🇪🇺 EUR, 🇦🇪 AED, 🇮🇶 IQD,
  🇮🇷 IRT/IRR; USDT keeps a Tether-green ₮ disc). `CurrencyBadge` renders them,
  so every screen picked them up without call-site changes. Five 1×1 SVGs are
  vendored from `country-flag-icons` (MIT) in `src/design-system/flags.ts` and
  drawn with `react-native-svg`'s `SvgXml` — no new dependency, Expo Go safe.

### Fixed
- Currency rows: three cluttered lines → two (flag · name · code | price · change).
- Units stacked under big numbers → one baseline ("۲۳۴٬۶۱۵ تومان") for prices,
  the portfolio total and the converter result; hero price leading-aligned.
- Large-title subtitle moved below the title in a secondary tone.
- Status strip: three lines of metadata → one quiet line.
- Content bled crisply through the floating tab bar → scroll-edge fade behind it
  (screens without a tab bar opt out).
- Converter picker orphaned «ریال» on a second row → one row, short labels;
  default amount in Persian digits.
- Chart: truncated «۱ ساعت» → short range labels; a flat series is centred
  instead of lying on the floor.
- Persian phrases with numbers rendered unit-before-number and `+۰` as `۰+`
  (stats, chart readout, converter base rate, transaction total) → RTL base +
  LRM, verified by measuring glyph positions.
- System RTL pinned off: the app mirrors itself by hand, so a Persian-locale
  iPhone would have flipped everything twice.
- Nested button (favourite star inside the row) → sibling elements.
- Home's portfolio and quick-converter rows now sit on grouped surfaces.

### Not changed
- `expo-doctor` now reports 20/21: Expo shipped new patch releases (e.g.
  `expo` 57.0.25) after the last check. Nothing installed changed; upgrading is
  left as a separate, deliberate step.
- The blue gear and the grey chevron tab seen on the phone are **Expo Go's**
  developer overlay; no ArzMan code draws them and they do not exist in a build.

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
- **The README's iPhone instructions were wrong and are corrected.** It told the reader to
  point the app at a LAN backend on `:8787`, which the deployed HTTPS Worker makes
  unnecessary. It now gives two routes: Expo Go first (free App Store install, whose current
  build runs React Native 0.86 — this project's exact version), and an EAS development build
  as the upgrade path when the app's own identity, the Persian Face ID string,
  `ios.enableSceneSupport` or a native extension is needed. That second route does require a
  paid Apple Developer account for signing, on Windows as much as on macOS.

  *A revision of this entry published on 2026-09-22 claimed Expo Go for iOS was no longer a
  free App Store install. That was wrong — it came from the `set-up-your-environment` docs
  page, which describes building a private Expo Go with `npx eas-cli@latest go`, not the
  App Store build. Corrected 2026-09-26; `docs/engineering-audit.md` §5 records both sources.*
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
