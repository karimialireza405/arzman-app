# ArzMan — Engineering Audit & iPhone Readiness

> Historical September audit. For the current 2026-10-04 app, taste-skill
> review and standalone Android APK evidence, read
> [taste-skill-audit.md](taste-skill-audit.md). Portfolio/Face ID have since been
> removed, and the existing deployed backend was healthy in the current checks.

**Audited:** 2026-09-22 (Asia/Tehran), continuing the audit started by the previous agent
**Scope:** correctness of market data, portfolio accounting, unit presentation, backend parity, runtime readiness for a physical iPhone
**Not in scope:** UI redesign, Widgets, Live Activities, Dynamic Island, Siri/App Intents, any deployment

Everything below was executed against this repository and against live sources. No result
in this document is estimated.

---

## 1. Findings by severity

| ID   | Sev    | Area                                                | Finding                                                                                                                                                                                                                                                                                                                                            | Status                                                                                          |
| ---- | ------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| A-1  | **P0** | `server/src/providers/tgju/index.ts`                | The parser required the page's FAQ sentence to quote _exactly_ the same number as the live quote table. TGJU renders the FAQ from a slower cache, so during trading hours it legitimately lags — the parser then threw `Conflicting FAQ price`, which fails the **whole** snapshot (all four currencies) and leaves the app serving a stale cache. | **Fixed**                                                                                       |
| A-2  | **P1** | `packages/shared/src/index.ts`                      | Price alerts could never fire. `alertMatches` gated on `isStale`, and `isStale` is permanently true for TGJU because the page publishes a clock-only label ("۱۹:۵۹:۵۸") that never establishes a trade timestamp. The feature was unreachable in production.                                                                                       | **Fixed**                                                                                       |
| A-3  | **P1** | `apps/mobile/app/currency/[code].tsx`               | Day high/low, previous close and daily change rendered Toman numbers under a "ریال" label when the user selected Rial.                                                                                                                                                                                                                             | **Fixed** (by the previous agent; verified live in both units)                                  |
| A-4  | **P2** | `apps/mobile/app/(tabs)/index.tsx`, `portfolio.tsx` | Portfolio total, open/realized P&L, daily change, per-holding value, average cost and the converter teaser were hard-coded to Toman and ignored the Rial preference — the one dashboard the user reads most stayed in a different unit from the rest of the app.                                                                                   | **Fixed**                                                                                       |
| A-5  | **P2** | `apps/mobile/app/(tabs)/portfolio.tsx`              | A holding with no market rate rendered a bare `—` with no explanation of why or what to do.                                                                                                                                                                                                                                                        | **Fixed** — names the currency and points at «نرخ من»                                           |
| A-6  | **P2** | `apps/mobile/app/custom-rates.tsx`                  | The screen claimed manual rates are used "در دارایی و مبدل". They were used only for USDT in the portfolio, never in the converter.                                                                                                                                                                                                                | **Fixed** — manual rate now fills an absent quote for any held asset; copy corrected            |
| A-7  | **P2** | Deployed Cloudflare Worker                          | The deployed Worker is **behind this repository**. See §4.                                                                                                                                                                                                                                                                                         | **Documented, not deployed**                                                                    |
| A-8  | **P2** | `apps/mobile/src/store.tsx`, `storage.ts`           | Deleting a transaction removed it from the ledger index but left its Keychain item on the device forever.                                                                                                                                                                                                                                          | **Fixed** — best-effort erase after the index commit, so the ledger can still never be stranded |
| A-9  | **P2** | `README.md`                                         | Documented the iPhone route as "install Expo Go from the App Store (free)" and required a LAN backend at `:8787`. Both are wrong today. See §5 and §6.                                                                                                                                                                                             | **Fixed**                                                                                       |
| A-10 | **P3** | `apps/mobile/app/currency/[code].tsx`               | Quote size rendered as a Latin `1` among Persian digits.                                                                                                                                                                                                                                                                                           | **Fixed**                                                                                       |
| A-11 | **P3** | `server/wrangler.jsonc`                             | `ALLOWED_ORIGIN: "*"`. Acceptable for a public, read-only, unauthenticated market API that holds no user data; tighten if the Worker ever gains state.                                                                                                                                                                                             | Accepted                                                                                        |
| A-12 | **P3** | `apps/mobile/app/(tabs)/portfolio.tsx`              | A fully closed position stays in the holdings list showing `۰ واحد` / `میانگین خرید ۰`. Cosmetic; it preserves the ledger's continuity.                                                                                                                                                                                                            | Accepted                                                                                        |
| A-13 | **P3** | `packages/shared/src/index.ts`                      | `PortfolioTransactionSchema.quantity` is strictly positive, so an "adjustment to zero" cannot be recorded; the user must sell the remainder instead.                                                                                                                                                                                               | Accepted                                                                                        |

### Deliberate behaviour that is _not_ a defect

The market status pill reads «متصل · تازگی منبع تأیید نشده» (amber) even when the data is
seconds old. This is correct and intentional: TGJU publishes only a wall-clock label or a
day/month label, never a full timestamp, so ArzMan refuses to claim it knows the trade time.
Retrieval freshness — which ArzMan _does_ know — is what now gates alerts (A-2).

---

## 2. TGJU parser — validation model after the fix

The previous validation treated the FAQ sentence as a price oracle. It is not one; it is
_convention_ evidence. The parser now separates the two roles:

| Signal            | Source                                                                             | Role                                                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quote value       | `[data-col="info.last_trade.PDrCotVal"]`, falling back to the «نرخ فعلی» table row | **Authoritative.** If both are present they must agree exactly (same table, same refresh).                                                                                                                            |
| Currency identity | `h1.title` must contain the expected Persian name                                  | Fail closed                                                                                                                                                                                                           |
| Unit              | «واحد پولی» row → `ریال`/`تومان`                                                   | **Authoritative.** Unknown unit fails closed.                                                                                                                                                                         |
| Quote size        | Presence of «قیمت هر <currency>»                                                   | Proves the page quotes **one** unit. A change to "قیمت صد …" fails closed — lot sizes are never guessed.                                                                                                              |
| FAQ unit          | The FAQ's own `ریال`/`تومان`                                                       | Must match the table's unit, else fail closed                                                                                                                                                                         |
| FAQ number        | FAQ `.price`                                                                       | **Corroborating only.** Must stay within ×0.5–×2 of the quote. A lagging FAQ moves by percents; a lot-size or decimal regression moves by 10×, so the regression class is still caught while normal lag is tolerated. |
| Daily bounds      | «بالاترین/پایین ترین قیمت روز»                                                     | Schema requires `low ≤ price ≤ high`                                                                                                                                                                                  |
| Previous close    | «نرخ روز گذشته»                                                                    | Must stay within ×0.5–×2 of the quote — the remaining anchor when TGJU omits high/low                                                                                                                                 |
| Absolute range    | —                                                                                  | IQD 0.1–1e6 Toman, other fiat 100–1e9 Toman                                                                                                                                                                           |
| Timestamp         | «زمان ثبت آخرین نرخ»                                                               | Only a full ISO timestamp is accepted; a clock-only or day/month label yields `null` and `stale: true`. Timestamps are never invented.                                                                                |

### Live verification — 2026-09-22 01:56 Asia/Tehran (`npm run verify`)

| Currency |  TGJU raw | Unit | Quote size |        Normalized | Previous close | Day low → high    | Source label | Timestamp | Stale  |
| -------- | --------: | ---- | ---------: | ----------------: | -------------: | ----------------- | ------------ | --------- | ------ |
| USD      | 2,308,000 | IRR  |     1 unit | **230,800 Toman** |        230,800 | 230,760 → 231,920 | «۳۰ شهریور»  | `null`    | `true` |
| EUR      | 2,650,100 | IRR  |     1 unit | **265,010 Toman** |        265,010 | 264,890 → 266,630 | «۳۰ شهریور»  | `null`    | `true` |
| AED      |   628,500 | IRR  |     1 unit |  **62,850 Toman** |         62,850 | 62,841 → 63,175   | «۳۰ شهریور»  | `null`    | `true` |
| IQD      |     1,486 | IRR  |     1 unit |   **148.6 Toman** |          148.6 | 145.1 → 155.1     | «۳۰ شهریور»  | `null`    | `true` |

All four pass. `stale: true` is the correct, honest reading of a label that carries no
trade time — not a failure.

An independent read of the same pages at 01:33 Tehran recorded the FAQ sentence in
agreement with the table (market closed, nothing moving), which is exactly why the
equality gate could pass in a quiet audit and fail during a live session.

---

## 3. Portfolio accounting

Arithmetic is kept at full `Number` precision between transactions and rounded only at the
presentation boundary. No decimal library is warranted: the worst observed drift over 41
alternating trades is below 1e-6 Toman, which is many orders of magnitude under the
smallest displayed unit.

Verified in `packages/shared/src/domain.test.ts` (`portfolio lifecycle`) **and** re-run by
hand through the real transaction form in the running app:

| Step | Input                              | Expected                                    | Observed in app (Rial display)                                                             |
| ---- | ---------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A    | empty portfolio                    | no assets, total 0                          | empty state, no rows                                                                       |
| B    | buy 100 USD @ 200,000              | qty 100, avg 200,000                        | ✅                                                                                         |
| C    | buy 50 USD @ 220,000               | qty 150, avg 31,000,000⁄150 = 206,666.66…   | ✅ `۲٬۰۶۶٬۶۶۷` Rial, total `۳۴۶٬۲۰۰٬۰۰۰` Rial                                              |
| D    | sell 40 USD @ 230,000              | qty 110, avg unchanged, realized 933,333.33 | ✅ realized `۹٬۳۳۳٬۳۳۳` Rial, unrealized `۲۶٬۷۴۶٬۶۶۷` Rial                                 |
| E    | sell 110 USD @ 235,000             | qty 0, basis 0, avg 0, realized 4,050,000   | ✅ realized `۴۰٬۵۰۰٬۰۰۰` Rial, no negative holding                                         |
| E′   | sell 500 USD                       | rejected                                    | ✅ «مقدار فروش بیشتر از موجودی است», nothing written                                       |
| F    | adjustment 25 @ 210,000            | qty 25, avg 210,000, realized preserved     | ✅ (unit test)                                                                             |
| G    | 10 USDT, no provider               | value unknown — **not** zero                | ✅ row `—`, total `—`, «نرخ بازار برای تتر در دسترس نیست؛ … در «نرخ من» نرخ دستی ثبت کنید» |
| H    | manual USDT rate 62,000            | 620,000 Toman, +3.33%                       | ✅ `۶٬۲۰۰٬۰۰۰` Rial, row marked «نرخ دستی»                                                 |
| —    | awkward: 3 @ 201,337 + 7 @ 218,913 | avg exactly 213,640.2                       | ✅                                                                                         |

A missing price makes the **total** unknown (`totalValuation` returns `null`) rather than
understating the portfolio. A closed position is worth exactly 0 and says so without
needing a price at all.

---

## 4. Backend: local vs deployed

Both were exercised with `npx tsx scripts/audit-api.ts <base>` on 2026-09-22.

| Request                                  | Local (`wrangler dev`)          | Deployed Worker                 |
| ---------------------------------------- | ------------------------------- | ------------------------------- |
| `GET /health`                            | 200                             | 200                             |
| `GET /api/market`                        | 200, 4 quotes, identical values | 200, 4 quotes, identical values |
| `GET /api/market/{USD,EUR,AED,IQD}`      | 200                             | 200                             |
| `GET /api/market/XXX`                    | 404                             | 404                             |
| `GET /api/history/USD?range=1D`          | 200                             | 200                             |
| `GET /api/history/XXX?range=1D`          | 400                             | 400                             |
| `GET /api/history/USD?range=bad`         | 400                             | 400                             |
| `GET /api/history/USD?range=toString`    | **400**                         | **503**                         |
| `GET /api/history/USD?range=__proto__`   | **400**                         | **503**                         |
| `GET /api/history/USD?range=constructor` | **400**                         | **503**                         |
| `POST /api/market`                       | 405                             | 405                             |
| `OPTIONS /api/market`                    | 204                             | 204                             |

> **The deployed backend is older than this repository.** It still looks a range up with
> `ranges[range]`, so any `Object.prototype` key passes the guard and crashes the Durable
> Object (503). The repository fixes this with `Object.hasOwn`. The app itself never sends
> such a range, so this is not a user-facing defect today — but the deployment also predates
> the **P0 parser fix (A-1)** and the previous-close guard, which _are_ user-facing.

**Nothing was deployed during this audit.** When the owner chooses to deploy:

```bash
npx wrangler deploy --config server/wrangler.jsonc
```

Re-run `npx tsx scripts/audit-api.ts <deployed URL>` afterwards; all rows above should then
read 400.

---

## 5. Expo Go vs development build — what this project can actually run

Checked against the official SDK 57 documentation on 2026-09-22, not against the previous
README's assumptions. "Included in Expo Go" below is the badge on each library's own
`docs.expo.dev/versions/v57.0.0/sdk/...` page.

| Feature                                                                              | Expo Web                        | Expo Go (iOS)                    | Development build | Notes                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------- | -------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Market data / converter / alerts logic                                               | ✅                              | ✅                               | ✅                | Plain JS over an HTTPS API                                                                                                                                    |
| Charts (`react-native-svg`)                                                          | ✅                              | ✅                               | ✅                | Bundled in Expo Go                                                                                                                                            |
| `expo-secure-store` (Keychain)                                                       | ❌ falls back to `localStorage` | ✅                               | ✅                | Included in Expo Go                                                                                                                                           |
| `expo-sqlite`                                                                        | ❌ falls back to `localStorage` | ✅                               | ✅                | Included in Expo Go                                                                                                                                           |
| `expo-local-authentication` (Face ID)                                                | ❌                              | ✅                               | ✅                | Included in Expo Go; in Expo Go the prompt uses **Expo Go's** permission string, not ArzMan's Persian one                                                     |
| `expo-glass-effect` (Liquid Glass)                                                   | ❌ falls back                   | ✅ iOS 26+                       | ✅ iOS 26+        | Included in Expo Go; falls back to a plain view below iOS 26                                                                                                  |
| `expo-blur`                                                                          | approximation                   | ✅                               | ✅                | Included in Expo Go                                                                                                                                           |
| `expo-symbols` (SF Symbols)                                                          | ❌ Ionicons fallback            | ✅                               | ✅                | Included in Expo Go                                                                                                                                           |
| `expo-clipboard`, `expo-constants`, `expo-linking`, `expo-status-bar`, `expo-router` | ✅                              | ✅                               | ✅                | Included in Expo Go                                                                                                                                           |
| `expo-haptics`                                                                       | ❌ no-op                        | ✅                               | ✅                | Every call site is guarded and `.catch()`-ed, so a missing engine degrades silently                                                                           |
| `expo-build-properties` → `ios.enableSceneSupport`                                   | n/a                             | ❌ **not applied**               | ✅                | A config plugin cannot change Expo Go's prebuilt binary                                                                                                       |
| App identity (name «ارز من», icon, `com.arzman.personal`)                            | n/a                             | ❌ runs inside the Expo Go shell | ✅                |                                                                                                                                                               |
| Push notifications                                                                   | ❌                              | ❌                               | ❌                | **Not implemented** — `nativeCapabilities.serverPush === false`. In-app alerts are local `Alert.alert` only, while the app is open.                           |
| Widgets · Live Activities · Dynamic Island · Siri/App Intents                        | ❌                              | ❌                               | ❌                | **Not implemented** — `nativeCapabilities` are all `false`. Each needs a native extension target, therefore a development build; out of scope for this audit. |

**No dependency in this project is incompatible with Expo Go.** Every native module it uses
is in the Expo Go bundle. Verified empirically: `npx expo start --go` serves a manifest with
`runtimeVersion: "exposdk:57.0.0"` and the iOS Hermes bundle builds and is served (HTTP 200,
8.0 MB).

### Expo Go on iOS — the actual situation (corrected 2026-09-26)

Two Expo sources say different things, and the difference matters:

- **`expo.dev/go` → SDK 57 → iOS device** links to the **App Store**
  (`id982107779`). That listing is **Free**, and its own technical note reads
  _"this version of Expo uses React Native 0.86"_ — which is exactly this project's
  React Native version. So the free App Store Expo Go does support SDK 57 today.
- **`docs.expo.dev/get-started/set-up-your-environment` → iOS → Expo Go** describes a
  _build-your-own_ Expo Go instead: enroll in the Apple Developer Program, run
  `npx eas-cli@latest go`, distribute through TestFlight. That is the path for an Expo Go
  you control (for instance an SDK the App Store build does not carry), not a statement that
  the App Store build has gone away.

**Therefore the free route is real and is the one to try first**: install Expo Go from the
App Store, run `npx expo start --go`, scan the QR. It costs nothing and needs no Apple
Developer Program membership.

A **development build** is still the better artifact, and its requirement is unchanged — the
docs state for macOS, Windows and Linux alike that _all builds that run on an iPhone device
require a paid Apple Developer account for build signing_. Move to it when you want what
Expo Go structurally cannot give: the app's own identity (name «ارز من», icon,
`com.arzman.personal`), the Persian Face ID permission string, `ios.enableSceneSupport`, or
any future native extension.

Expo Web remains fully usable on Windows for logic and layout work, but it is **not**
evidence of iPhone-native behaviour: no Keychain, no Face ID, no SF Symbols, no Liquid
Glass, no haptics.

## 6. Network topology

Two independent connections; they are often confused:

| Link                             | Endpoint                                                                              | Needed for                   |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| Metro (JS bundle + fast refresh) | this PC, `192.168.70.170:8081` — confirmed as the active IPv4                         | iPhone ↔ Windows, same Wi-Fi |
| Market API                       | the deployed Cloudflare Worker over **HTTPS** (`apps/mobile/.env.local`, git-ignored) | iPhone ↔ internet            |

`apps/mobile/.env.local` already points `EXPO_PUBLIC_API_URL` at the deployed HTTPS Worker.
**Therefore the local Worker on port 8787 is not required for iPhone testing**, no LAN
backend URL needs to be set, no firewall rule is needed for 8787, and plain-HTTP App
Transport Security issues do not arise. Run `npm run server` only to develop the backend
itself.

---

## 7. Security review

- `apps/mobile/.env.local` (which holds the deployed Worker URL) is git-ignored via
  `apps/mobile/.gitignore` → `.env*.local`; only `.env.example` with a placeholder is tracked.
- No Cloudflare, Expo, Apple or API credential is tracked anywhere in the repository; a scan
  of every tracked file for credential-shaped strings returns only prose in documentation.
- `research/` is git-ignored, so captured pages and scratch scripts cannot be committed.
- No portfolio data is committed. Transactions live in the iOS Keychain
  (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) and never leave the device — the Worker has no user
  data, no auth and no write endpoints.
- `EXPO_PUBLIC_*` values are bundled into the client by design; only the public Worker URL is
  stored there.

---

## 8. Verification results

Run on 2026-09-22 against the current working tree:

| Check          | Command                                              | Result                                                                                        |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| TypeScript     | `npm run typecheck`                                  | ✅ shared + server + mobile, 0 errors                                                         |
| Lint           | `npm run lint`                                       | ✅ 0 errors, 0 warnings                                                                       |
| Unit tests     | `npm test`                                           | ✅ **35/35** in 3 files (was 24 at handover)                                                  |
| Expo Doctor    | `npx expo-doctor`                                    | ✅ 21/21                                                                                      |
| Export         | `npx expo export --platform all`                     | ✅ web 2.4 MB, iOS Hermes 3.9 MB, Android Hermes 4.2 MB                                       |
| Live market    | `npm run verify`                                     | ✅ USD, EUR, AED, IQD — see §2                                                                |
| API (local)    | `npx tsx scripts/audit-api.ts http://127.0.0.1:8787` | ✅ 14/14                                                                                      |
| API (deployed) | `npx tsx scripts/audit-api.ts <worker URL>`          | ⚠️ 11/14 — see §4                                                                             |
| Runtime        | `npx expo start --web`, driven in a browser          | ✅ live data, unit switch, full portfolio lifecycle, offline fallback                         |
| Offline        | `fetch` forced to fail at runtime                    | ✅ status → «آفلاین · نمایش نرخ‌های ذخیره‌شده», cached rates retained, portfolio still valued |
