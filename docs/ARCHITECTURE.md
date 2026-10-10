# Architecture

## Overview

```text
 phone / browser ──HTTPS──▶ Cloudflare Worker ──▶ MarketStore (Durable Object, SQLite)
   Expo app                  arzman-market              │
                                                        ├─▶ tgju.org/profile/price_*   (4 core currencies)
                                                        └─▶ tgju.org/currency          (20 extra currencies)
```

- **`apps/mobile`** — Expo Router screens, one foreground data store
  (`src/store.tsx`), the UI kit in `src/components` and design tokens in
  `src/design-system`. All text goes through `Label`, which applies Vazirmatn, a
  line height of at least 1.5625× and no letter-spacing on Persian.
- **`packages/shared`** — Zod schemas (`CurrencyQuote`, `MarketSnapshot`), the
  currency registry (`coreCodes`, `extraCodes`, `fiatCodes`), normalisation,
  conversion and alert rules. Imported by the app and the Worker.
- **`server`** — the Worker. A single global Durable Object (`MarketStore`)
  serialises refreshes, validates quotes, stores the last good snapshot and keeps
  observations for charts.

## Currencies and validation

**Core four** (USD, EUR, AED, IQD) are read from their own TGJU profile pages
(~0.9 MB each). A profile must show a «واحد پولی» row and the per-unit FAQ
(«قیمت هر …»); the live quote, the summary table and the FAQ must agree on unit and
magnitude, and a move of more than 2× against the previous close is rejected.

**Extras** (the other 20) are read from the currency overview in one request, at
most every 4 minutes, stopping once every row has arrived (~250 KB). The overview has
no unit row, so each value is anchored instead:

1. _Unit_ — the page's USD row must match the core USD quote (verified from its
   profile page moments earlier). Same page, same unit (Rial).
2. _Lot size_ — only the stated «(100 ین)» for JPY is accepted; any other number in
   a currency's name drops that currency rather than guessing a divisor.
3. _Magnitude_ — each currency's implied USD cross rate must be within a factor of
   three of its long-run value, which catches a 10× or 100× regression.
4. _Change_ — the signed change and the rounded percentage must agree.

A row that fails is dropped and logged; the rest stand. A page that fails the anchor
is rejected whole and the last good extras are kept.

Every price is normalised to **Toman per one unit**; the raw value, raw unit and quote
size are kept on the quote.

## API

| Endpoint                                              | Returns                            |
| ----------------------------------------------------- | ---------------------------------- |
| `GET /health`                                         | `{ service, ok }`                  |
| `GET /api/market`                                     | **v1** — exactly the 4 core quotes |
| `GET /api/v2/market`                                  | **v2** — all 24 quotes             |
| `GET /api/market/:code`                               | one quote (any of the 24)          |
| `GET /api/history/:code?range=1H\|1D\|1W\|1M\|3M\|1Y` | real observations, bucketed        |

> **v1 must stay at exactly four quotes.** App installs from before 0.2.0 parse the
> snapshot with a four-quote schema; widening v1 would blank their screens. New
> currencies and fields go to v2 only. The app asks v2 first and falls back to v1.

A cold source failure returns 503; a later failure returns the last good snapshot
with `stale` flags. `sourceTimestamp` is `null` when the source supplies no
trustworthy trade time; `fetchedAt` must never be shown as the trade time.

## Scheduling and cost

The store refreshes every 45 s while someone is using the app and every 10 minutes
otherwise (`server/src/schedule.ts`); extras refresh at most every 4 minutes. Every
SQL statement reaches rows through the `(currency, timestamp)` primary key — a
full-table scan once exhausted the Workers Free plan's 5 M rows-read/day and took
the API down. `server/test/sql.test.ts` checks the query plans; keep it green.

## Platforms

|         | iOS                                                         | Android                   | Web                         |
| ------- | ----------------------------------------------------------- | ------------------------- | --------------------------- |
| Tab bar | system `UITabBarController` (Liquid Glass) via `NativeTabs` | ArzMan floating glass bar | the same floating bar       |
| File    | `app/(tabs)/_layout.tsx`                                    | `_layout.android.tsx`     | `_layout.web.tsx` → android |

Material's native bottom navigation follows the _device_ theme, not the app's own
setting, which is why Android uses its own bar. The app's appearance choice is also
handed to the platform with `Appearance.setColorScheme`.

The app lays Persian out right-to-left by hand (`row-reverse`) and pins system RTL
off; do not enable `I18nManager` RTL or everything flips twice.
