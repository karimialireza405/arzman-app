# TODO — ArzMan (ارز من)

## Completed Milestones

### Milestone 0.3 — Apple HIG / Liquid Glass UI redesign (2026-09-21, Cline session)

- [x] Recover and finish Claude's uncommitted work (tokens.ts refactor + Apple reference docs).
- [x] Extend design tokens (`apps/mobile/src/design-system/tokens.ts`):
  - [x] Apple system colors for dark/light, OLED `#000000`, semantic fills (`fillPrimary…fillQuaternary`).
  - [x] `borderCurve: "continuous"` squircle token (`curve`) + `concentricRadius` / `concentricPairs`.
  - [x] 8pt spacing grid + semantic spacing aliases; 4-level shadow elevations.
  - [x] Spring presets (`press/tab/modal/snappy/gentle`) + motion durations.
- [x] Currency icon system (`apps/mobile/src/design-system/currency-icons.ts`):
  - [x] One squircle badge family, sizes xs–xl, tones tint/filled/neutral.
  - [x] USD `$`, EUR `€`, AED `د.إ`, IQD `ع.د`, USDT `₮`, IRT/IRR.
  - [x] Per-glyph RTL/LTR direction, Apple system tints, dark/light aware.
- [x] Rebuild UI kit as modules (`apps/mobile/src/components/*`, barrel in `src/ui.tsx`):
  - [x] Theme + haptics + spring press feedback + system Reduce Motion.
  - [x] SF Symbols (`AppIcon`), Dynamic Type `Label`, hairline `Divider`.
  - [x] Opaque `Surface`/`GroupedList` content; Liquid Glass `Glass` chrome only.
  - [x] Apple-semantic `Button` (prominent/tinted/bordered/glass/plain/destructive).
  - [x] `IconButton`, `SegmentedControl` with traveling indicator, `SearchField`.
  - [x] `ChangePill`, `RangeMeter` (real low/high/current — fabricated sparkline removed).
  - [x] `Screen` with safe-area + floating-tab-bar clearance, `Section`, `EmptyState`, `AmountInput`.
- [x] Redesign screens:
  - [x] Floating Liquid Glass tab bar (58pt capsule, labels, quiet selection, RTL-mirrored order, haptics).
  - [x] Home (hero quote + real range meter, portfolio glance, grouped market list, quick actions).
  - [x] Markets (iOS search + scope segments + inset grouped rows + favorite toggles).
  - [x] Converter (badge chip pickers, floating swap control, one prominent CTA).
  - [x] Portfolio (quiet hero, P/L columns, allocation bar, grouped holdings, tap-to-delete ledger).
  - [x] More/Settings (iOS Settings grouped sections, switches, segmented preferences).
  - [x] Currency detail (Stocks-calm hero, chart, grouped stats, stacked actions).
  - [x] Alerts / Custom rates / Transaction sheets (form-first, honest notices).
- [x] Verification: `npm run check` (typecheck + lint + 22 tests), `npx expo-doctor` 21/21,
  `npx expo export --platform all` (Web/iOS/Android).
- [x] Documentation: HANDOFF §0, TODO, CHANGELOG, README, apple-reference-index,
  apple-ui-findings §14, ui-audit "Post-Redesign Status".

### Milestone 0.2 — verified baseline & first design system (2026-09-21, Claude session)

- [x] Inspect existing repository structure, git status, and baseline architecture.
- [x] Fix baseline lint errors (unused transaction removal variables in `portfolio.tsx`).
- [x] Establish test suite and typecheck clean baseline.
- [x] Create the first `ArzManDesignSystem` foundations and reusable UI components.
- [x] Upgrade all screens to the first Liquid Glass pass.
- [x] Update `HANDOFF.md`, `TODO.md`, `CHANGELOG.md`.

---

## Future Native & Cloud Enhancements

- [ ] Deploy Cloudflare Worker (`npx wrangler deploy`) and verify public HTTPS endpoint.
- [ ] Run EAS Development Build (`npx eas-cli build --platform ios --profile development`) for physical iPhone testing.
- [ ] Visual QA pass on a physical iPhone (Expo Go → dev build) — web is not the benchmark.
- [ ] Build WidgetKit extension (Lock Screen and Home Screen widgets for USD/EUR/AED/IQD).
- [ ] Build ActivityKit Live Activity extension for tracking a selected currency during active trading sessions.
- [ ] Implement remote push notifications worker with Apple Push Notification Service (APNs) credentials for closed-app price alerts.
- [ ] Polish: adopt `Surface` in `src/chart.tsx` for identical radii; consider a max Dynamic-Type clamp for money values.
