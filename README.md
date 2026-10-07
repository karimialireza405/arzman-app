# ارز من · ArzMan

[![CI](https://github.com/karimialireza405/arzman-app/actions/workflows/ci.yml/badge.svg)](https://github.com/karimialireza405/arzman-app/actions/workflows/ci.yml)
![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)
![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)

**Persian-first live currency dashboard for the Iranian open market** — 24 currencies,
a converter, price alerts and personal rates, for iPhone, Android and the web.
Built with Expo, React Native and a small Cloudflare Worker that reads public
[TGJU](https://www.tgju.org) pages. No paid market-data API and no account is
needed to use it.

> نبض بازار آزاد، در دستان شما — نرخ لحظه‌ای ۲۴ ارز، مبدل، هشدار قیمت و نرخ شخصی.

## Features

- **24 currencies** with round flags — USD, EUR, AED, GBP, TRY, IQD, CNY, CAD, AUD,
  CHF, JPY, SAR, QAR, OMR, KWD, BHD, RUB, INR, AFN, AZN, AMD, GEL, MYR, THB.
- **Converter** between any two currencies, Toman and Rial, with searchable picker.
- **Market** list with search and region filters, currency detail with a real
  history chart (observed samples only — never interpolated or generated).
- **Price alerts** (above / below / daily change / rapid move) while the app is open,
  and **personal rates** (your exchange's or USDT) compared with the open market.
- Toman / Rial display, Persian / Latin digits, dark / light / system appearance.
- Native feel on each platform: the iOS system tab bar with Liquid Glass; a floating
  glass tab bar on Android and the web; Vazirmatn typography with measured Persian
  line heights; haptics and Reduce Motion support.
- Installable on iPhone from Safari (**Add to Home Screen**) — no Apple account.

## Architecture

```text
apps/mobile        Expo Router app: screens, UI kit (src/components), design tokens
packages/shared    Zod schemas, normalisation, conversion and alert rules — used by both sides
server             Cloudflare Worker + one SQLite Durable Object; TGJU providers and parsers
docs               Research, audits, install guides, history
scripts            API audit and live-source verification
```

The app only talks to our Worker. One global Durable Object serialises refreshes,
validates every quote (units, lot size, magnitude) before it is stored, keeps the
last known good snapshot when the source fails, and records observations for history.
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data flow, API versions and the
validation rules.

## Getting started

Requirements: Node.js 24 LTS and Git. npm only — do not mix lockfiles.

```bash
npm ci
npm run check          # typecheck + lint + tests
```

Point the app at a market API (a deployed Worker, or `npm run server` locally):

```bash
cp apps/mobile/.env.example apps/mobile/.env.local   # then edit EXPO_PUBLIC_API_URL
npm run start                                         # Expo; press w for the browser
```

Everything about running on a phone, building an APK or a web bundle and deploying
the Worker is in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) and
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run start` | Expo dev server for the mobile app |
| `npm run server` | Worker on `localhost:8787` (`wrangler dev`) |
| `npm run check` | Typecheck, lint and tests — what CI runs |
| `npm run verify` | Fetch the live TGJU sources and validate them |
| `npm run build:web -w @arzman/mobile` | Static web build in `apps/mobile/dist` |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) · [Development](docs/DEVELOPMENT.md) · [Deployment](docs/DEPLOYMENT.md)
- [Android installation guide (Persian)](docs/android-install.md)
- [TGJU research](docs/TGJU-RESEARCH.md) · [Native capabilities](docs/NATIVE-CAPABILITIES.md)
- [Roadmap and open work](TODO.md) · [Changelog](CHANGELOG.md)
- Audits and history: [docs/taste-skill-audit.md](docs/taste-skill-audit.md), [docs/history](docs/history)

## Data and limits

Prices come from public TGJU pages and are shown for information only; they can
differ between exchanges and across the day. TGJU publishes no trade timestamp, so
the app reports *retrieval* freshness and never presents it as the trade time.
Alerts run while the app is open; there is no push delivery. Review TGJU's terms
before any broad public redistribution.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

Copyright © 2026 Alireza Karimi. All rights reserved — see [LICENSE](LICENSE).
Third-party notices: flag artwork is MIT-licensed
([country-flag-icons](https://github.com/catamphetamine/country-flag-icons));
the Lion and Sun flag is public domain.

## Developer

**علیرضا کریمی** · [github.com/karimialireza405](https://github.com/karimialireza405) · alirezkarimi0021@gmail.com
