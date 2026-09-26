import { describe, expect, it } from "vitest";
import {
  normalize,
  parseAmount,
  calculatePortfolio,
  valuation,
  totalValuation,
  convert,
  MarketSnapshotSchema,
  alertMatches,
  isStale,
  isFetchFresh,
  formatNumber,
  type Asset,
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
  it("pads decimals only when asked, so a column of percentages lines up", () => {
    expect(formatNumber(0, false, 2)).toBe("0");
    expect(formatNumber(0, false, 2, 2)).toBe("0.00");
    expect(formatNumber(0.5, false, 2, 2)).toBe("0.50");
    expect(formatNumber(1.234, false, 2, 2)).toBe("1.23");
    // minDigits can never exceed digits — it would throw a RangeError in Intl.
    expect(formatNumber(1, false, 0, 2)).toBe("1");
    expect(formatNumber(0.43, true, 2, 2)).toBe("۰٫۴۳");
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
  it("retains accounting precision until presentation", () => {
    const [a] = calculatePortfolio([
      { currency: "USD", timestamp: "2026-09-20T00:00:00.000Z", id: "1", type: "buy", quantity: 3.333333, costToman: 100.1 },
    ]);
    expect(a.quantity).toBeCloseTo(3.333333, 6);
    expect(a.costBasis).toBeCloseTo(3.333333 * 100.1, 10);
    expect(a.averageCost).toBeCloseTo(100.1, 2);
  });
});
describe("portfolio accounting", () => {
  const base = {
    currency: "USD" as const,
    timestamp: "2026-09-20T00:00:00.000Z",
  };
  it("preserves a repeating weighted average through partial sales", () => {
    const buys = [
      { ...base, id: "1", type: "buy" as const, quantity: 2, costToman: 100 },
      { ...base, id: "2", type: "buy" as const, quantity: 1, costToman: 101 },
    ];
    const [before] = calculatePortfolio(buys);
    const [after] = calculatePortfolio([...buys,
      { ...base, id: "3", type: "sell", quantity: 1, costToman: 110 },
    ]);
    expect(after.averageCost).toBe(before.averageCost);
    expect(after.averageCost).toBeCloseTo(301 / 3, 10);
    expect(after.costBasis).toBeCloseTo(2 * 301 / 3, 10);
    expect(after.realizedPnl).toBeCloseTo(110 - 301 / 3, 10);
  });
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
    expect(usdt.quantity).toBeCloseTo(50.3, 10);
    expect(usdt.averageCost).toBe(60000);
    expect(usdt.realizedPnl).toBe(50.25 * 5000);
  });
});
it("does not turn missing prices into a portfolio loss", () => {
  const [asset] = calculatePortfolio([{ id: "missing", currency: "USDT", type: "buy", quantity: 1, costToman: 100, timestamp: "2026-09-20T00:00:00Z" }]);
  expect(totalValuation([valuation(asset, null)])).toBeNull();
  expect(totalValuation([valuation(asset, 120)])).toBe(120);
  expect(totalValuation([valuation({ ...asset, quantity: 0, costBasis: 0 }, null)])).toBe(0);
});
it("rejects malformed snapshots", () => {
  expect(MarketSnapshotSchema.safeParse({ quotes: [quote] }).success).toBe(
    false,
  );
});
it("fires once on a freshly retrieved quote and never on a served cache", () => {
  const alert = {
    id: "a",
    currency: "USD" as const,
    kind: "above" as const,
    threshold: 1,
    enabled: true,
    triggeredAt: null,
  };
  // A live TGJU quote carries a clock-only source label, so `isStale` is always
  // true. Gating alerts on it would make the whole feature unreachable.
  expect(isStale(quote)).toBe(true);
  expect(isFetchFresh(quote)).toBe(true);
  expect(alertMatches(alert, quote)).toBe(true);
  expect(
    alertMatches({ ...alert, triggeredAt: new Date().toISOString() }, quote),
  ).toBe(false);
  // A cache served after an upstream failure keeps its original retrieval time.
  const served = {
    ...quote,
    fetchedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  };
  expect(isFetchFresh(served)).toBe(false);
  expect(alertMatches(alert, served)).toBe(false);
});

/**
 * End-to-end ledger walk-through of the scenarios an owner actually performs.
 * Every expectation is an exact arithmetic identity, not a rounded snapshot, so
 * a regression that reintroduces early rounding fails here instead of silently
 * shifting someone's cost basis.
 */
describe("portfolio lifecycle", () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 8, 20, 0, minute)).toISOString();
  const tx = (
    id: string,
    type: "buy" | "sell" | "adjustment",
    quantity: number,
    costToman: number,
    minute: number,
    currency: Asset = "USD",
  ) => ({ id, currency, type, quantity, costToman, timestamp: at(minute) }) as const;

  it("starts empty", () => {
    expect(calculatePortfolio([])).toEqual([]);
    expect(totalValuation([])).toBe(0);
  });

  it("walks buy → buy → partial sell → full close → adjustment", () => {
    const buy1 = [tx("1", "buy", 100, 200_000, 1)];
    const [a] = calculatePortfolio(buy1);
    expect(a.quantity).toBe(100);
    expect(a.averageCost).toBe(200_000);
    expect(a.costBasis).toBe(20_000_000);

    const buy2 = [...buy1, tx("2", "buy", 50, 220_000, 2)];
    const [b] = calculatePortfolio(buy2);
    expect(b.quantity).toBe(150);
    // 31,000,000 / 150 does not terminate in decimal; it must not be rounded here.
    expect(b.averageCost).toBe(31_000_000 / 150);
    expect(b.costBasis).toBe(31_000_000);

    const sold = [...buy2, tx("3", "sell", 40, 230_000, 3)];
    const [c] = calculatePortfolio(sold);
    expect(c.quantity).toBe(110);
    expect(c.averageCost).toBe(b.averageCost);
    expect(c.costBasis).toBeCloseTo(110 * b.averageCost, 6);
    expect(c.realizedPnl).toBeCloseTo(40 * (230_000 - b.averageCost), 6);
    expect(valuation(c, 230_800)!.value).toBeCloseTo(110 * 230_800, 6);

    const closed = [...sold, tx("4", "sell", 110, 235_000, 4)];
    const [d] = calculatePortfolio(closed);
    expect(d.quantity).toBe(0);
    expect(d.costBasis).toBe(0);
    expect(d.averageCost).toBe(0);
    expect(d.realizedPnl).toBeCloseTo(
      40 * (230_000 - b.averageCost) + 110 * (235_000 - b.averageCost),
      6,
    );
    // A closed position is worth zero, and says so even without a market price.
    expect(valuation(d, null)).toEqual({ value: 0, pnl: 0, pnlPercent: null, breakEven: 0 });

    const adjusted = [...closed, tx("5", "adjustment", 25, 210_000, 5)];
    const [e] = calculatePortfolio(adjusted);
    expect(e.quantity).toBe(25);
    expect(e.averageCost).toBe(210_000);
    expect(e.costBasis).toBe(5_250_000);
    expect(e.realizedPnl).toBe(d.realizedPnl);
  });

  it("never reports a negative holding and refuses to oversell", () => {
    const held = [tx("1", "buy", 1, 100, 1)];
    expect(() => calculatePortfolio([...held, tx("2", "sell", 1.5, 100, 2)])).toThrow();
    for (const asset of calculatePortfolio([...held, tx("2", "sell", 1, 100, 2)]))
      expect(asset.quantity).toBeGreaterThanOrEqual(0);
  });

  it("keeps awkward prices exact through a partial sell", () => {
    const buys = [tx("1", "buy", 3, 201_337, 1), tx("2", "buy", 7, 218_913, 2)];
    const [a] = calculatePortfolio(buys);
    expect(a.averageCost).toBe((3 * 201_337 + 7 * 218_913) / 10);
    const [b] = calculatePortfolio([...buys, tx("3", "sell", 4, 225_000, 3)]);
    expect(b.averageCost).toBe(a.averageCost);
    expect(b.quantity).toBe(6);
    expect(b.realizedPnl).toBeCloseTo(4 * (225_000 - a.averageCost), 6);
  });

  it("does not accumulate visible float drift over many partial trades", () => {
    const ledger = [tx("r0", "buy", 1, 100_000, 0)];
    for (let i = 1; i <= 40; i++)
      ledger.push(tx(`r${i}`, i % 2 ? "buy" : "sell", 0.1, 100_000 + i, i));
    const [asset] = calculatePortfolio(ledger);
    expect(asset.quantity).toBeCloseTo(1, 10);
    // Drift must stay far below the smallest unit a price is ever displayed in.
    expect(Math.abs(asset.costBasis - asset.quantity * asset.averageCost)).toBeLessThan(1e-6);
    expect(formatNumber(asset.quantity, false, 2)).toBe("1");
  });

  it("treats a missing rate as unknown, not as a zero-value loss", () => {
    const [usdt] = calculatePortfolio([tx("1", "buy", 10, 60_000, 1, "USDT")]);
    expect(valuation(usdt, null)).toBeNull();
    expect(totalValuation([valuation(usdt, null)])).toBeNull();
    // A manual rate is what makes the holding valuable again.
    expect(valuation(usdt, 62_000)!.value).toBe(620_000);
    expect(totalValuation([valuation(usdt, 62_000)])).toBe(620_000);
    // One unknown asset makes the *total* unknown rather than understating it.
    const [usd] = calculatePortfolio([tx("2", "buy", 1, 200_000, 2)]);
    expect(totalValuation([valuation(usd, 230_800), valuation(usdt, null)])).toBeNull();
  });

  it("keeps a fractional-Toman currency readable", () => {
    const [iqd] = calculatePortfolio([tx("1", "buy", 1000, 147.9, 1, "IQD")]);
    expect(iqd.costBasis).toBeCloseTo(147_900, 6);
    const value = valuation(iqd, 1486 / 10)!;
    expect(value.value).toBe(148_600);
    expect(formatNumber(1486 / 10, false, 2)).toBe("148.6");
    expect(formatNumber(1486 / 10 - 1479 / 10, false, 2)).toBe("0.7");
  });
});
