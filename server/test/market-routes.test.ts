import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  coreCodes,
  extraCodes,
  MarketSnapshotSchema,
  type CurrencyQuote,
  type MarketSnapshot,
} from "@arzman/shared";
import { parseTgju } from "../src/providers/tgju";
import { parseOverview } from "../src/providers/tgju/overview";

// The Durable Object base class only exists inside workerd. A bare stand-in
// is enough to exercise MarketStore's routing on its own.
vi.mock("cloudflare:workers", () => ({
  DurableObject: class {
    ctx: unknown;
    env: unknown;
    constructor(ctx: unknown, env: unknown) {
      this.ctx = ctx;
      this.env = env;
    }
  },
}));

const fixture = (name: string) =>
  readFileSync(`server/test/fixtures/${name}.html`, "utf8");

let store: { fetch(request: Request): Promise<Response> };

beforeAll(async () => {
  const { MarketStore } = await import("../src/index");
  const now = Date.now();
  const core = coreCodes.map((c) => ({
    ...parseTgju(fixture(c.toLowerCase()), c),
    fetchedAt: new Date(now).toISOString(),
  }));
  // The overview fixture was captured beside a USD quote of 268,700 Toman.
  const extras = parseOverview(fixture("overview"), 268_700, now);
  const snapshot: MarketSnapshot = {
    schemaVersion: 1,
    quotes: core,
    fetchedAt: new Date(now).toISOString(),
    status: "stale",
  };
  // `lastAttempt` is fresh, so fetch() serves the stored data without
  // calling the upstream provider.
  const data = new Map<string, unknown>([
    ["snapshot", snapshot],
    ["extras", extras],
    ["lastAttempt", now],
  ]);
  const ctx = {
    storage: {
      get: async (key: string) => data.get(key),
      put: async (key: string, value: unknown) => void data.set(key, value),
      delete: async (key: string) => data.delete(key),
      getAlarm: async () => now + 60_000,
      setAlarm: async () => undefined,
      sql: { exec: () => ({ toArray: () => [] }) },
    },
  };
  store = new MarketStore(ctx as never, {} as never);
});

const get = (path: string) =>
  store.fetch(new Request(`https://arzman.test${path}`));

describe("MarketStore routing", () => {
  it("v1 /api/market returns exactly the four core quotes", async () => {
    // Installed apps parse v1 with a four-quote schema; extra quotes break them.
    const response = await get("/api/market");
    expect(response.status).toBe(200);
    const body = MarketSnapshotSchema.parse(await response.json());
    expect(body.quotes.map((q: CurrencyQuote) => q.currency)).toEqual([
      ...coreCodes,
    ]);
  });

  it("v2 /api/v2/market returns all 24 quotes", async () => {
    const body = MarketSnapshotSchema.parse(
      await (await get("/api/v2/market")).json(),
    );
    expect(body.quotes.map((q: CurrencyQuote) => q.currency)).toEqual([
      ...coreCodes,
      ...extraCodes,
    ]);
    expect(body.quotes).toHaveLength(24);
  });

  it("serves one quote, and 404s for unknown paths", async () => {
    const usd = await get("/api/market/USD");
    expect(((await usd.json()) as CurrencyQuote).currency).toBe("USD");
    expect((await get("/api/nope")).status).toBe(404);
    expect((await get("/api/market/XXX")).status).toBe(404);
  });
});
