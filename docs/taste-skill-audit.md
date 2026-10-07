# ArzMan: taste-skill review and Android distribution

Date: 2026-10-04. Repository: `D:\MY_APP\Arz_Man`.

## Scope and design read

Applied the installed `C:/Users/karim/.codex/skills/taste-skill/SKILL.md`.
The skill primarily targets websites and explicitly excludes native mobile and
data-heavy apps from its default recipe. Here its audit-first, brand-preserving,
typography, hierarchy, interaction and responsive checks are applied to the
existing Expo app. No marketing-page template or new project was introduced.

Design read: a Persian daily currency tool, where readable financial numbers,
manual RTL, clear network/source states and restrained feedback lead the design.
The actual brand uses indigo/violet, near-black surfaces and a gold shamseh mark.
Preserve all four tab names/order, navigation, form order, logo, Vazirmatn,
currency flags and genuine history. Contextual dials: variation 3, motion 3,
density 5. Retire platform-specific wording on shared screens, undersized tap
targets and motion that ignores the user's accessibility preference.

## Architecture verified from source

```text
Android / iPhone
  Expo Router: Home | Markets | Converter | More
    currency detail | price alerts | personal rates
  shared UI / Vazirmatn / manual RTL / platform icon adapters
  single foreground market store -> HTTPS Cloudflare Worker
    SQLite Durable Object -> validated TGJU public profiles
    last-known-good snapshot / bounded sampled history / backoff
  local SQLite: preferences, favorites, alerts, personal rates, market cache
```

Portfolio and Face ID were previously removed by the owner. This release does
not restore them. Alerts work while the app is open; push, widgets and Apple
extensions remain disabled. Android uses Material native tabs and Ionicons;
Apple Liquid Glass and SF Symbols are iOS-specific, with shared fallback surfaces.

## Concrete changes for this release

- `apps/mobile/app/(tabs)/converter.tsx`: currency selector, swap and quick amounts
  now have 48-point tap targets; the selector modal has a SafeAreaView; its slide
  and swap rotation honor Reduce Motion. Forms and calculation rules preserved.
- `apps/mobile/app/(tabs)/more.tsx`: appearance caption now refers to the device,
  rather than an iPhone, on this shared screen.
- `components/primitives.tsx`, converter and `quote-hero.tsx`: native numeric
  text can fit the available width. The converter uses a smaller result size
  below 360 pixels; reproduced clipping of 1,000 USD on a 320px screen motivated
  this change. Complete digits remain the priority over a fixed display size.
- `apps/mobile/app.json`: Android package `com.arzman.personal`, adaptive icon,
  and explicit exclusion of unused audio/storage/overlay permissions.
- `apps/mobile/eas.json`: internal preview creates a standalone APK.
- `expo-system-ui`: required native support for configured automatic appearance.
- SDK 57 compatible patch alignment, following Expo Doctor's actual output.
- `.easignore`: retains Git's exclusion rules and also excludes `.claude/` and
  distribution artifacts from cloud build uploads. No private env files uploaded.

## Remaining findings

| Priority | Evidence and files | Why it matters / next action |
| --- | --- | --- |
| P1 | `server/src/providers/tgju/index.ts`, `apps/mobile/src/components/market.tsx`, `app/currency/[code].tsx`: live source returns time-only labels; sourceTimestamp remains null and stale true, while the green strip says “به‌روز” and detail prints only the time label. | Retrieval freshness is distinct from verified trade freshness. Add a compact explicit source-time qualification; never describe an observed quote as a verified current trade. A provider with dated trade timestamps is needed to remove this limitation. This is not an installation blocker. |
| P2 | `apps/mobile/src/history.ts`: TTL is checked only when load is called; mounted tabs do not periodically refresh sparklines. | Small charts can remain older than the quote. Add foreground refresh respecting the five-minute cache and shared in-flight request, with last-good series on failure. |
| P2 | `apps/mobile/src/components/quote-hero.tsx`, `components/market.tsx`, converter: financial text disables font scaling; large fixed prices and long results require narrow-screen and large-font QA. | Financial digits must remain visible. Prefer measured sizing and complete accessible labels rather than ellipsis for monetary results. |
| P2 | `apps/mobile/src/components/controls.tsx`: compact segmented controls; `primitives.tsx`: small metadata. | Some secondary controls remain denser than Android's common 48dp target. A separate TalkBack/large-font pass should verify all controls, rather than redesign navigation during distribution work. |
| P2 | `design-system/tokens.ts`: textTertiary uses translucent small text. Calculated over dark surface: 4.17:1; light white surface: 3.41:1. | Small helper/footer text misses 4.5:1. Increase tertiary contrast or use secondary for meaningful helper text. Primary white-on-accent buttons pass at 5.15:1 dark and 7.10:1 light. These are token calculations, not a full WCAG certification of every gradient/blur pixel. |
| P2 | `server/src/index.ts`, `server/src/sql.ts`: sampling bounds returned history points, but a 1Y request still aggregates underlying annual observations. | Many clients or repeated long-range requests can consume the Worker/DO free quota. Measure rows read under distribution load and cache long-range responses or pre-aggregate history; no personal data is required. |
| P2 | `package-lock.json`, npm audit: transitive build-tool advisories include braces/node-forge/undici. | Review reachability and compatible upstream fixes separately. Audit's suggested Expo/RN downgrades are incompatible with this SDK; do not run audit fix --force. These findings do not by themselves demonstrate an APK runtime vulnerability. |
| P2 | Native tab bar, sheets, keyboard, back button, SQLite, haptics: no Android device attached (`adb devices` empty). | Build/export checks cannot prove physical-device quality. First real installation must verify launch, navigation, keyboard, persistence, offline recovery and both themes. |
| P3 | `apps/mobile/src/design-system/tokens.ts`, README older sections: comments describe earlier pure-black/system-blue/icon designs. | Keep documentation aligned with actual near-black/violet palette and flags. Historical handoff sections should not be used as current acceptance evidence. |
| P3 | `components/primitives.tsx`: importing the vector-icon barrel exports many unused font assets (103 assets in all-platform export). | Use the direct Ionicons entry and compare export/APK sizes in a separate size optimization pass. |

No new P0 was reproduced in the reviewed paths. This is not a claim that all
possible native defects or security issues are ruled out.

## Verification recorded so far

- Baseline `npm run check`: typecheck, lint, 46 tests in 7 files passed.
- Initial Expo Doctor: 20/21, six compatible patch mismatches, being corrected.
- `npm run verify`: 4/4 real TGJU profiles parsed successfully at
  2026-10-04T10:43:27Z. Raw Rial / 10 / quoteSize = Toman:
  USD 2,711,800 / 10 / 1 = 271,180; EUR 3,062,700 / 10 / 1 = 306,270;
  AED 742,390 / 10 / 1 = 74,239; IQD 1,800 / 10 / 1 = 180.
  All four sourceTimestamp null, stale true. These are observations at audit
  time, not promised prices when the APK is opened later.
- `npx tsx scripts/audit-api.ts https://arzman-market.<your-account>.workers.dev`:
  14/14 endpoint/status/schema/CORS checks passed; 1D history had 120 real points.
- EAS existing authentication and preview public API variable verified read-only.
- Local SDK preparation failed downloading CMake with an invalid archive;
  cloud build will use the existing project's EAS account.
- Dependency installation initially failed with ECONNRESET. The official npm
  tarball is being cached locally to complete installation without changing registry.

## Post-change verification

- Final `npm run check`, run from the repository root: typecheck/lint and
  **46/46 tests in 7 files pass**. A mistaken invocation inside the mobile
  workspace reported no `check` script; the correct root invocation passed.
- `npx expo-doctor`: **21/21 pass**, including compatible patch alignment.
- Final `npx expo export --platform all --output-dir dist/android-release-audit`:
  passes for Android, iOS and Web; Android Hermes bundle 5.1MB, iOS 5MB,
  web JavaScript 3.3MB, 103 combined exported assets. These are exports,
  not signed native installers.
- Dependency installation completed using the official npm registry after
  locally caching its 29MB expo-modules-core tarball. No forced audit upgrades.
  Final `npm audit --json` reports 32 advisories (20 high, 12 moderate), including
  inherited toolchain chains; see the remaining findings above.
- Browser review of Home, Markets (EUR search), currency detail (real chart),
  converter, More (light theme), alerts (invalid amount rejected), and personal
  rates. Widths 360px and 320px inspected. The 1,000 USD result clipped at 320px
  before the scoped fix. Converter currency/quick-amount buttons measure 48px.
  Corrected 320px/light converter shows all digits of the 1,000 USD result;
  evidence saved in `artifacts/converter-320-light.png` (web preview).
  No console errors captured; web warns about pointerEvents/shadow deprecations
  and useNativeDriver's expected JS fallback. Web is not proof of native tabs,
  SQLite, keyboard or haptics quality.
- Browser network-off simulation plus manual refresh: existing values and
  converter result stayed visible; the strip changed to “آفلاین · آخرین نرخ”.
  Network conditions were restored after this disposable test. This verifies
  the running web store failure path, not a physical Android airplane-mode test.
- First cloud job `f5b0515c-52e4-4c47-86cf-8d267ff480aa` was canceled to include
  the measured narrow-screen fix. Final job:
  `47f81330-8859-4b34-ac22-fc4eff1a748b`, preview / INTERNAL / 0.1.0 / code 1.
  Existing account authenticated; Android signing key created by EAS and reused
  for the final job. No private signing material was printed or committed.
  Gradle logs confirm `:app:assembleRelease` and an embedded index.android.bundle.
  The cloud job's dependency step ran `npm ci --include=dev` successfully
  (776 packages added); local package.json dependency ranges match the lockfile.
- Final live-source rerun at 2026-10-04T11:04:31Z: 4/4 pass; observed Toman
  prices USD 266,500, EUR 300,940, AED 72,950, IQD 176.3. Raw Rial values
  2,665,000 / 3,009,400 / 729,500 / 1,763; all quote sizes 1. Prices changed
  during this session; both observations are recorded, neither is a fixture.
  Source timestamps remain null and stale flags true.
- Git's tracked-file scan found no `.env*`, private keys, keystore or credential
  files under those filename patterns. The mobile store only sends GET market/
  history requests, not local preferences/alerts/personal rates, to the backend.
  This limited source/file-pattern check is not a comprehensive secrets scan.

## Signed build outcome

EAS job `47f81330-8859-4b34-ac22-fc4eff1a748b` finished successfully at
2026-10-04T11:14:28Z. Gradle: **BUILD SUCCESSFUL in 19m 24s**. Release artifact:
`app-release.apk`, 108MB in the cloud log. This was an internal distribution build,
not a deployment to Google Play or a new backend deployment.

- [Download standalone APK](https://expo.dev/artifacts/eas/jRj0STzf4B9n8nu2YfwLCrR-t5G6h3fVP9Gj8VOoho0.apk)
- [Build record](https://expo.dev/accounts/alirezkarimi/projects/arzman/builds/47f81330-8859-4b34-ac22-fc4eff1a748b)
- Distribution/first-device instructions: [android-install.md](android-install.md).

Local distribution file: `D:\MY_APP\Arz_Man\artifacts\ArzMan-0.1.0-android.apk`.

| APK inspection | Actual result |
| --- | --- |
| File size | 114,174,667 bytes (108.89 MiB) |
| SHA-256 | `6a17c3e128b2d6d2bcfd13c9961c675583a4d19f46ed65720d3c252bf10ba102` |
| Package / visible name | `com.arzman.personal` / ارز من |
| Version / versionCode | `0.1.0` / `1` |
| Minimum / target SDK | 24 (Android 7.0) / 36 |
| Architectures | arm64-v8a, armeabi-v7a, x86, x86_64 |
| Launcher | `com.arzman.personal.MainActivity` |
| Debuggable manifest flag | Absent; aapt reports no application-debuggable marker |
| Signature | apksigner exit 0, **Verifies**, v2 signature, one RSA 2048-bit signer |
| Signer certificate SHA-256 | `1c890a03cd7ff8b35948a44ae63f944c4c9b2e53d7e32c55ed9a63ebaf414505` |
| Normal Android permissions | INTERNET, VIBRATE; own non-exported receiver signature permission also present |
| JavaScript | `assets/index.android.bundle`, 4,252,512 bytes, production HTTPS API string present |
| Persian fonts | All six Vazirmatn weights verified by SHA-256 against the bundled TTF resources |

Checks performed with SDK build-tools 36.0.0 `apksigner verify --verbose --print-certs`,
`aapt dump badging`, `aapt dump permissions`, `aapt dump xmltree`, Get-FileHash and
ZIP resource inspection. Resource shrinking renames the fonts (e.g. res/H6.ttf),
so filename search alone initially returned zero Vazirmatn names; content digest
comparison verified all six exact font files. A companion `.apk.sha256` is saved
beside the file. Binary artifacts are deliberately Git-ignored.

The cloud archive captured the working tree before the source changes were
committed. Its Git metadata still points to the prior HEAD, rather than being a
claim that the old commit contains these fixes. Current source commits:
`ae08840` (UI fixes), `76f0cd1` (standalone Android build configuration).

**Ready for direct installation and first-device testing.** No Android device or
emulator was attached and no native launch was performed. Signed release build,
export, manifest, bundle/font/API and browser checks cannot establish that all
Android native interactions are correct. Physical-device QA remains explicit,
especially native tabs, keyboard, safe areas, TalkBack, large text, SQLite,
haptics, offline restart and Android back behavior. The backend was already
deployed; this task did not deploy it, publish to Play, change billing or log in
to a new account. The original untracked `.claude/` directory was preserved.
