# TODO — ArzMan (ارز من)

## Completed Milestones

- [x] Inspect existing repository structure, git status, and baseline architecture.
- [x] Fix baseline lint errors (unused transaction removal variables in `portfolio.tsx`).
- [x] Establish test suite and typecheck clean baseline (18/18 tests passing).
- [x] Create `ArzManDesignSystem` foundations (`apps/mobile/src/design-system/`):
  - [x] OLED black palette (`#000000`) & pure Apple light mode palette (`#F2F2F7`).
  - [x] Apple concentric corner geometry utilities (`concentricRadius`).
  - [x] iOS 27 Liquid Glass materials & styling helpers (regular, clear, prominent, rim).
  - [x] Semantic typography scales & tabular digits formatting (`fontVariant: ['tabular-nums']`).
  - [x] Spring animation curves and haptic feedback profiles.
- [x] Upgrade Reusable UI Components (`apps/mobile/src/ui.tsx`):
  - [x] `GlassView` & `GlassContainer` native Liquid Glass wrappers with fallback.
  - [x] `GlassButton` with iOS 27 hierarchy (prominent, regular, secondary, icon, quiet).
  - [x] `GlassIconButton` circular/compact controls.
  - [x] `GlassSearchBar` with Persian RTL support and clear button.
  - [x] `GlassSegmentedControl` with smooth selection indicator.
  - [x] `MarketHero` overview card with live USD showcase, sparkline, and quick actions.
  - [x] `CurrencyCard` & `CurrencyRow` with Apple Stocks / Wallet layout.
  - [x] `MarketChangeBadge` with directional chevron and subtle tint.
  - [x] `SpreadBar` miniature daily spread indicator.
  - [x] `AppIcon` supporting native SF Symbols on iOS via `expo-symbols`.
- [x] Upgrade Screens:
  - [x] Floating Liquid Glass Tab Bar in `app/(tabs)/_layout.tsx`.
  - [x] Modal formSheet presentations in `app/_layout.tsx`.
  - [x] Home Dashboard in `app/(tabs)/index.tsx` (Hero Market Area, Watchlist, Quick Actions, Portfolio glance).
  - [x] Market Screen in `app/(tabs)/market.tsx` (Live search, filters, spread info, favorite stars).
  - [x] Converter in `app/(tabs)/converter.tsx` (Interactive rotating spring swap, tactile inputs, live rates).
  - [x] Currency Detail & Chart in `app/currency/[code].tsx` & `src/chart.tsx` (Stocks-style bezier chart, scrub indicator, stats grid).
  - [x] Portfolio in `app/(tabs)/portfolio.tsx` & `app/transaction.tsx` (Multi-asset allocation bar, asset holding cards, P&L, transaction deletion with prompt, Face ID gate).
  - [x] Alerts & Custom Rates in `app/alerts.tsx` & `app/custom-rates.tsx`.
  - [x] More (Settings) in `app/(tabs)/more.tsx`.
- [x] Full Verification:
  - [x] Monorepo typecheck: 0 errors (`npm run typecheck`).
  - [x] Monorepo lint: 0 errors, 0 warnings (`npm run lint`).
  - [x] Unit tests: 18/18 tests passing (`npm test`).
  - [x] Multiplatform bundle export: Web, iOS Hermes bytecode, Android Hermes bytecode (`npx expo export --platform all`).
  - [x] Update `HANDOFF.md`, `TODO.md`, `CHANGELOG.md`.

---

## Future Native & Cloud Enhancements

- [ ] Deploy Cloudflare Worker (`npx wrangler deploy`) and verify public HTTPS endpoint.
- [ ] Run EAS Development Build (`npx eas-cli build --platform ios --profile development`) for physical iPhone testing.
- [ ] Build WidgetKit extension (Lock Screen and Home Screen widgets for USD/EUR/AED/IQD).
- [ ] Build ActivityKit Live Activity extension for tracking a selected currency during active trading sessions.
- [ ] Implement remote push notifications worker with Apple Push Notification Service (APNs) credentials for closed-app price alerts.
