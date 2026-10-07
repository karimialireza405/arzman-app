# ArzMan (ارز من) — notes for working on this repository

Persian-first currency dashboard for the Iranian open market. Expo SDK 57 /
React Native 0.86 / TypeScript monorepo + a Cloudflare Worker. Read
[README.md](README.md), then [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
`apps/mobile/AGENTS.md` says to read the versioned Expo docs
(https://docs.expo.dev/versions/v57.0.0/) before writing Expo code.

## Working with the owner

- The owner writes Persian. Report in Persian, in plain words, and end with one
  recommended next step. Give one route with exact commands, not a menu.
- Owner: Alireza Karimi · github.com/karimialireza405 · alirezkarimi0021@gmail.com.
  Develops on Windows 11 with a real iPhone; **no Mac**, no paid Apple account.
- **Ask before anything outward-facing or hard to reverse**: deploying the Worker,
  deploying the web site, starting an EAS build, deleting deployed resources, making
  the repository public. Never log in to Cloudflare, Expo or Apple on their behalf.
- The repository is **public** under the MIT license (see LICENSE). `README.md` is the
  English front page and `README.fa.md` the Persian one; keep them in sync.

## Commands

```bash
npm ci
npm run check                      # typecheck + lint + tests (CI runs this)
npm run server                     # Worker on :8787
npm run start                      # Expo
npm run build:web -w @arzman/mobile
```

## Rules that must not be broken

- **`GET /api/market` (v1) returns exactly 4 quotes.** Old app installs parse it with a
  four-quote schema. New data goes to `/api/v2/market`.
- Never generate prices or history; unknown units/lot sizes fail closed.
- Every SQL statement stays on the `(currency, timestamp)` primary key (Workers Free
  plan limit: 5 M rows read/day). `server/test/sql.test.ts` guards it.
- All text goes through `Label`; Persian line height ≥ 1.5625×, no letter-spacing on
  Persian; fills behind white text use `accentSolid`.
- The app lays out RTL by hand and pins system RTL off. Do not enable `I18nManager` RTL.
- iOS uses native tabs; Android and the web use `FloatingTabBar` — change both.
- Never print or commit `apps/mobile/.env.local` or any key, token or keystore.
- Web exports: pass `--clear` and check the bundle does not contain `127.0.0.1`
  before `wrangler deploy` (see docs/DEPLOYMENT.md).

## Verify UI changes

Run the web export and look at it at 393×852 in dark and light; check text clipping
and the bottom tab bar. Native-only effects (Liquid Glass, SF Symbols, haptics) can
only be confirmed on a device.

## Where things are

`apps/mobile/app` screens · `apps/mobile/src/components` UI kit · `apps/mobile/src/design-system`
tokens, fonts, flags, icons · `packages/shared/src/index.ts` schemas and currency
registry · `server/src/providers/tgju` parsers · `TODO.md` open work ·
`CHANGELOG.md` · `docs/history` earlier hand-off notes.
