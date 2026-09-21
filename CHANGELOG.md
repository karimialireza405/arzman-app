# Changelog — ArzMan (ارز من)

All notable changes to this project will be documented in this file.

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
