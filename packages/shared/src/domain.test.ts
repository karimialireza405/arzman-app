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
  it("cross-converts USD ↔ EUR via derived Toman rates", () => {
    const usd = { ...quote, currency: "USD" as const, priceToman: 100 };
    const eur = { ...quote, currency: "EUR" as const, priceToman: 110 };
    const quotes = [usd, eur];
    // 110 USD should be exactly 100 EUR when USD=100 and EUR=110 Toman
    expect(convert(110, "USD", "EUR", quotes)).toBeCloseTo(100, 6);
    expect(convert(100, "EUR", "USD", quotes)).toBeCloseTo(110, 6);
    // USD ↔ IRR
    expect(convert(1, "USD", "IRR", quotes)).toBeCloseTo(1000, 6);
    expect(convert(5000, "IRR", "USD", quotes)).toBeCloseTo(5, 6);
    // EUR ↔ IRT
    expect(convert(2, "EUR", "IRT", quotes)).toBeCloseTo(220, 6);
    expect(convert(220, "IRT", "EUR", quotes)).toBeCloseTo(2, 6);
  });
  it("rounds the prices and quantities to Toman precision", () => {
    const [a] = calculatePortfolio([
      { currency: "USD", timestamp: "2026-09-20T00:00:00.000Z", id: "1", type: "buy", quantity: 3.333333, costToman: 100.1 },
    ]);
    // quantity preserved, cost basis rounded to 2 decimals (3.333333 * 100.1 = 333.666...)
    expect(a.quantity).toBeCloseTo(3.333333, 6);
    expect(a.costBasis).toBeCloseTo(333.67, 2);
    expect(a.averageCost).toBeCloseTo(100.1, 2);
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
      pnlPercent: 33.33,
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
  it("preserves exact average cost across multiple sequential partial sells", () => {
    // 1. Buy 10 @ 100 (basis 1000, avg 100)
    // 2. Buy 20 @ 160 (basis 3200, total basis 4200, total qty 30, avg 140)
    // 3. Sell 10 @ 200 (realized pnl +600, basis 4200 - 1400 = 2800, qty 20, avg 140)
    // 4. Sell 10 @ 120 (realized pnl -200, total realized 400, basis 1400, qty 10, avg 140)
    // 5. Sell 10 @ 140 (realized pnl 0, total realized 400, basis 0, qty 0, avg 0)
    const [asset] = calculatePortfolio([
      { ...base, id: "1", type: "buy", quantity: 10, costToman: 100 },
      { ...base, id: "2", type: "buy", quantity: 20, costToman: 160 },
      { ...base, id: "3", type: "sell", quantity: 10, costToman: 200 },
      { ...base, id: "4", type: "sell", quantity: 10, costToman: 120 },
    ]);
    expect(asset.quantity).toBe(10);
    expect(asset.averageCost).toBe(140);
    expect(asset.costBasis).toBe(1400);
    expect(asset.realizedPnl).toBe(400);

    const [closed] = calculatePortfolio([
      { ...base, id: "1", type: "buy", quantity: 10, costToman: 100 },
      { ...base, id: "2", type: "buy", quantity: 20, costToman: 160 },
      { ...base, id: "3", type: "sell", quantity: 10, costToman: 200 },
      { ...base, id: "4", type: "sell", quantity: 10, costToman: 120 },
      { ...base, id: "5", type: "sell", quantity: 10, costToman: 140 },
    ]);
    expect(closed.quantity).toBe(0);
    expect(closed.costBasis).toBe(0);
    expect(closed.averageCost).toBe(0);
    expect(closed.realizedPnl).toBe(400);
  });
  it("handles fractional decimal quantities without float drift", () => {
    const [usdt] = calculatePortfolio([
      { currency: "USDT", timestamp: base.timestamp, id: "1", type: "buy", quantity: 100.55, costToman: 60000 },
      { currency: "USDT", timestamp: base.timestamp, id: "2", type: "sell", quantity: 50.25, costToman: 65000 },
    ]);
    expect(usdt.quantity).toBe(50.3);
    expect(usdt.averageCost).toBe(60000);
    expect(usdt.realizedPnl).toBe(50.25 * 5000);
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
