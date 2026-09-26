# TODO — ArzMan (ارز من)

## Completed Milestones

### Milestone 0.4.0 — portfolio removed (2026-09-27)

- [x] Remove the «دارایی من» tab, screens, transaction sheet, home summary,
      detail action, biometric lock, Keychain/Face ID modules and shared domain.

## Open — backend

- [ ] **Deployed Worker returns 503 on every Durable Object call** (health is
      200, TGJU is fine). Owner checks Cloudflare dashboard → Workers →
      `arzman-market` → Metrics for an exhausted Free-plan limit; recheck after
      00:00 UTC (03:30 Tehran). If a limit is the cause, cut Durable Object work
      (e.g. stop the 24/7 45-second alarm loop when nobody is reading) before
      redeploying.

### Milestone 0.3.2 — first on-device pass (2026-09-27)

- [x] Run in Expo Go on the owner's iPhone (free App Store install) — works.
- [x] Round country flags for every currency.
- [x] Fix the visual anomalies found on-device (rows, units, header, status,
      tab-bar bleed, converter picker, chart labels/flat line, RTL text order,
      nested button, bare home rows).
- [x] Pin system RTL off (the app mirrors by hand).

### Milestone 0.3.1 — engineering audit & iPhone readiness (2026-09-22)

- [x] Recover, finish and commit the previous agent's uncommitted work (nothing discarded).
- [x] **P0** Remove the TGJU FAQ equality gate that rejected valid live USD/EUR/AED quotes;
      replace it with unit + magnitude corroboration and a previous-close anchor.
- [x] **P1** Make price alerts reachable — gate on retrieval freshness (`isFetchFresh`),
      not on `isStale`, which is permanently true for a source that publishes no trade time.
- [x] **P2** Apply the Toman/Rial display unit across the whole portfolio dashboard and the
      home teaser; number and label now always move together.
- [x] **P2** Explain a missing rate in the UI; let any asset's manual rate fill an absent
      quote; correct the custom-rate screen's description.
- [x] **P2** Erase a deleted transaction's Keychain item (after the index commit).
- [x] **P3** Persian digits for the quote size on the currency detail screen.
- [x] Portfolio edge cases A–H as permanent tests *and* walked by hand in the running app.
- [x] Measure local vs deployed backend parity; document the deployment gap without deploying.
- [x] Establish the real Expo Go / development-build situation from the current official docs.
- [x] Verification: `npm run check` (typecheck + lint + **35 tests**), `npx expo-doctor`
      21/21, `npx expo export --platform all`, `npm run verify` (4/4 live), `audit-api.ts`.
- [x] Documentation: `docs/engineering-audit.md` (new), HANDOFF §00, README (iPhone route and
      compatibility matrix corrected), CHANGELOG, TODO.

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

## Next — on-device QA (not blocked; Expo Go is free)

- [x] Install Expo Go from the App Store and run `npm run start -w @arzman/mobile -- --go`.
- [x] Commit the EAS `projectId`/`owner` that `eas init` added to `apps/mobile/app.json`.
- [ ] Owner re-checks the redesigned screens on the iPhone and reports what still
      looks wrong (light mode, portfolio with data, detail chart).
- [ ] Upgrade the five Expo patch releases `expo-doctor` flags
      (`npx expo install --check`), then re-run the full verification.
- [ ] Later, when the app's own identity / Persian Face ID string / `enableSceneSupport` are
      wanted: EAS development build (needs a paid Apple Developer account for signing).
- [ ] On-device checklist: home · USD/EUR/AED/IQD detail · pull-to-refresh · converter ·
      manual USDT rate ·
      offline (airplane mode) · Toman ⇄ Rial · RTL · dark/light · charts · tab bar ·
      Dynamic Type · VoiceOver.

## Deferred / not implemented

- [ ] **Deploy the Worker** — the deployed one predates the P0 parser fix and the
      `Object.hasOwn` range guard: `npx wrangler deploy --config server/wrangler.jsonc`.
      Re-run `npx tsx scripts/audit-api.ts <url>` afterwards; it should be 14/14.
- [ ] WidgetKit extension (Lock Screen / Home Screen widgets).
- [ ] ActivityKit Live Activity + Dynamic Island.
- [ ] Siri / App Intents.
- [ ] Remote push notifications (APNs credentials, server scheduler, opt-in registration).
- [ ] Polish: adopt `Surface` in `src/chart.tsx` for identical radii; consider a max
      Dynamic-Type clamp for money values; hide fully closed positions from the holdings list.
