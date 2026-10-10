import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { coreCodes, type MarketSnapshot } from "@arzman/shared";
import { parseTgju } from "../src/providers/tgju";
import { parseBrsApi } from "../src/providers/brsapi";

const now = Date.parse("2026-10-10T12:00:00Z");
const reference: MarketSnapshot = {
  schemaVersion: 1,
  quotes: coreCodes.map((c) =>
    parseTgju(readFileSync(`server/test/fixtures/${c.toLowerCase()}.html`, "utf8"), c),
  ),
  fetchedAt: new Date(now).toISOString(),
  status: "stale",
};
/** A response that agrees with the TGJU reference prices. */
const body = (override: Record<string, Record<string, unknown>> = {}) => ({
  currency: coreCodes.map((c) => ({
    symbol: c,
    unit: "تومان",
    price: reference.quotes.find((q) => q.currency === c)!.priceToman,
    time_unix: now / 1000 - 30,
    date: "1405/07/18",
    time: "15:30",
    ...override[c],
  })),
});

describe("BRSAPI fallback parser", () => {
  it("builds a labelled, validated snapshot", () => {
    const s = parseBrsApi(body(), reference, now);
    expect(s.quotes.map((q) => q.currency)).toEqual([...coreCodes]);
    expect(s.quotes.every((q) => q.source === "BRSAPI" && !q.stale)).toBe(true);
    expect(s.status).toBe("ok");
  });
  it("converts rials to toman", () => {
    const usd = reference.quotes.find((q) => q.currency === "USD")!;
    const s = parseBrsApi(body({ USD: { unit: "ریال", price: usd.priceToman * 10 } }), reference, now);
    expect(s.quotes[0].priceToman).toBeCloseTo(usd.priceToman);
  });
  it("rejects a lot-size / unit mistake that disagrees with TGJU", () => {
    const iqd = reference.quotes.find((q) => q.currency === "IQD")!;
    expect(() => parseBrsApi(body({ IQD: { price: iqd.priceToman * 1000 } }), reference, now)).toThrow(/magnitude/);
  });
  it("fails closed on unknown units, missing or duplicate currencies, bad shape", () => {
    expect(() => parseBrsApi(body({ EUR: { unit: "دلار" } }), reference, now)).toThrow(/unit/);
    expect(() => parseBrsApi({ currency: body().currency.slice(1) }, reference, now)).toThrow(/USD/);
    expect(() => parseBrsApi({ currency: [...body().currency, ...body().currency] }, reference, now)).toThrow();
    expect(() => parseBrsApi({}, reference, now)).toThrow();
  });
  it("marks quotes without a trade time as stale instead of live", () => {
    const s = parseBrsApi(body({ USD: { time_unix: undefined } }), reference, now);
    expect(s.quotes[0].stale).toBe(true);
    expect(s.quotes[0].sourceTimestamp).toBeNull();
  });
});
