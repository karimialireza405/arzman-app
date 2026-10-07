# Contributing

1. `npm ci`, then `npm run check` — it must pass before and after your change.
2. Work on a branch, keep commits small, and use `feat(scope):`, `fix(scope):`,
   `docs:` or `build:` prefixes.
3. Open a pull request using the template. CI runs typecheck, lint, tests and an
   Android and web bundle export.

Rules that protect users (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)):

- **Never widen `GET /api/market`** — it serves older app installs exactly four
  quotes. New data goes to `/api/v2/market`.
- **Never generate market prices or history.** Unknown units or lot sizes fail closed.
- Keep SQL on the primary key (`server/test/sql.test.ts` checks the query plans).
- Persian text goes through `Label`; line height stays ≥ 1.5625×.
- No secrets in the repository; `EXPO_PUBLIC_*` values are public.
