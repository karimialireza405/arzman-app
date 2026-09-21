import { describe, expect, it } from "vitest";
import {
  normalize,
  parseAmount,
  calculatePortfolio,
  valuation,
  convert,
  MarketSnapshotSchema,
  alertMatches,
  type CurrencyQuote,
} from "./index";
import { parseTgju } from "../../../server/src/providers/tgju";
import { readFileSync } from "node:fs";
const quote = parseTgju(
  readFileSync("server/test/fixtures/usd.html", "utf8"),
  "USD",
);
describe("units and input", () => {
  it("normalizes only explicit units and quote sizes", () => {
    expect(normalize(12000, "IRR", 1)).toBe(1200);
    expect(normalize(12000, "IRT", 1)).toBe(12000);
    expect(normalize(12000, "IRR", 100)).toBe(12);
    expect(() => normalize(20, "IRR", 0)).toThrow();
  });
  it("accepts Persian and Arabic digits and rejects partial numbers", () => {
    expect(parseAmount("۱۲۳٬۴۵۶٫۵")).toBe(123456.5);
    expect(parseAmount("١٢٣")).toBe(123);
    for (const s of ["", "1x", "Infinity", "-3"])
      expect(() => parseAmount(s)).toThrow();
  });
  it("converts both directions and cross rates", () => {
    const eur = {
      ...quote,
      currency: "EUR",
      priceToman: quote.priceToman * 2,
    } as CurrencyQuote;
    expect(convert(2, "USD", "EUR", [quote, eur])).toBe(1);
    expect(convert(100, "IRR", "IRT", [])).toBe(10);
    expect(convert(100, "IRT", "IRR", [])).toBe(1000);
    expect(() => convert(1, "AED", "IRT", [])).toThrow();
  });
});
describe("portfolio accounting", () => {
  const base = {
    currency: "USD" as const,
    timestamp: "2026-09-20T00:00:00.000Z",
  };
  it("uses weighted average and maintains cost basis after sale", () => {
    const [a] = calculatePortfolio([
      { ...base, id: "1", type: "buy", quantity: 10, costToman: 100 },
      { ...base, id: "2", type: "buy", quantity: 10, costToman: 200 },
      { ...base, id: "3", type: "sell", quantity: 5, costToman: 180 },
    ]);
    expect(a.quantity).toBe(15);
    expect(a.averageCost).toBe(150);
    expect(a.realizedPnl).toBe(150);
    expect(valuation(a, 200)).toEqual({
      value: 3000,
      pnl: 750,
      pnlPercent: (750 / 2250) * 100,
      breakEven: 150,
    });
    expect(valuation(a, null)).toBeNull();
  });
  it("rejects overselling and supports explicit adjustment", () => {
    expect(() =>
      calculatePortfolio([
        { ...base, id: "1", type: "sell", quantity: 1, costToman: 100 },
      ]),
    ).toThrow();
    const [a] = calculatePortfolio([
      { ...base, id: "1", type: "adjustment", quantity: 3, costToman: 90 },
    ]);
    expect(a.costBasis).toBe(270);
  });
});
it("rejects malformed snapshots", () => {
  expect(MarketSnapshotSchema.safeParse({ quotes: [quote] }).success).toBe(
    false,
  );
});
it("never fires an alert on stale data and fires once on fresh data", () => {
  const alert = {
    id: "a",
    currency: "USD" as const,
    kind: "above" as const,
    threshold: 1,
    enabled: true,
    triggeredAt: null,
  };
  expect(alertMatches(alert, quote)).toBe(false);
  const fresh = {
    ...quote,
    stale: false,
    sourceTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  };
  expect(alertMatches(alert, fresh)).toBe(true);
  expect(
    alertMatches({ ...alert, triggeredAt: new Date().toISOString() }, fresh),
  ).toBe(false);
});
