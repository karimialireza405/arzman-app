# TGJU investigation — 2026-09-21

Direct HTTPS fetches of the four public pages returned HTTP 200 without authentication, CAPTCHA handling or browser impersonation. Relevant DOM excerpts are preserved in `server/test/fixtures/`; complete downloads remain ignored local research files.

| Currency | Observed public profile                      | Unit | Quoted quantity |
| -------- | -------------------------------------------- | ---- | --------------- |
| USD      | https://www.tgju.org/profile/price_dollar_rl | ریال | each dollar     |
| EUR      | https://www.tgju.org/profile/price_eur       | ریال | each euro       |
| AED      | https://www.tgju.org/profile/price_aed       | ریال | each dirham     |
| IQD      | https://www.tgju.org/profile/price_iqd       | ریال | each dinar      |

`/profile/price_dollar` redirects to `/profile/price_dollar_rl`. Each inspected profile has a `واحد پولی` row and a FAQ answer saying `در حال حاضر قیمت هر ...`. For IQD this explicitly says each dinar, not 100 dinars. The parser requires both pieces of evidence on every response. Quote size is an explicit provider contract of one; a future lot-size source requires a separate mapping and evidence, not a guessed divisor.

## Delivery and parser choice

The rendered price appears at `[data-col="info.last_trade.PDrCotVal"]`. The independently labelled summary table contains `نرخ فعلی`, `نرخ روز گذشته`, `بالاترین قیمت روز`, `پایین ترین قیمت روز`, and `زمان ثبت آخرین نرخ`. The table is the fallback price parser; when both copies exist they must agree. The FAQ price is cross-checked as well. Currency title and unit semantics are required in both paths. Missing/negative/zero/impossible or contradictory prices reject the entire snapshot.

The page references these public market endpoints:

- `https://api.tgju.org/v1/market/indicator/summary-table-data/price_dollar_rl?lang=fa&order_dir=asc`
- `https://api.tgju.org/v1/market/indicator/today-table-data/price_dollar_rl?lang=fa`
- `https://api.tgju.org/v1/market/list-data?category_ids=28070&extra_data=1&lang=fa`

The summary endpoint was fetched once and returned HTTP 200 JSON with thousands of historical rows, two calendar dates and HTML change fragments. It lacks the explicit unit/lot metadata used by our validation. It is not used in production until column semantics, freshness, units, and access conditions can be pinned by tests. Do not blindly use a similarly named USD profile for history; some are toman-specific.

Other observed endpoints concern advertising, accounts, watchlists and alerts. They are not market feeds for this application and are not called. `call.tgju.org` is a preconnect hint, not sufficient evidence of a usable endpoint. No embedded script is executed, no credentials are collected, no access controls are bypassed.

## Timestamp limitation

Current HTML returns `۲۹ شهریور` without year or trade time. A time-only label is also insufficient to establish an exact trade date. These are preserved in `sourceTimeLabel`; `sourceTimestamp` stays null and `stale` stays true. Fetch time is an independent UTC timestamp. Alerts never trigger on these unverified timestamps. The parser accepts only a complete ISO timestamp with timezone if the source later supplies one. Next provider enhancement: investigate whether the publicly referenced today/list feed supplies an authoritative full timestamp, with fixtures proving its relationship to the price.

Daily movement is derived from the independently labelled previous-day price, not from an unsigned CSS change fragment. Missing values stay null.

## Frequency and limits

Four profile pages are approximately 0.8–0.9 MB each. Use a single Durable Object and a five-minute global refresh, including after errors; concurrent app requests share one refresh. Phone polling defaults to 60 seconds against our cache. Upstream requests are sequential with 12-second timeouts and a 2 MB response cap. A failure retains the complete last valid snapshot and marks it stale. A 403/429/challenge is a failure, never a reason to evade restrictions.

The inspected https://www.tgju.org/robots.txt does not disallow these profile paths; it disallows several unrelated paths including `/cdn-cgi/`. Robots availability is not a redistribution license or service guarantee. This is a personal-use integration, and public redistribution requires a separate review of the provider's terms. No authorized paid API or commercial data license is claimed.

## Observation history

The backend stores validated observations at fetch time in SQLite, with source and stale flags. It does not claim these are exchange trades or official closing prices. Ranges select existing observations in time buckets (up to about 240 points) without fabricating missing points. Retention is one year. Initial history is naturally empty/short. Native chart rendering is still subject to device QA.
