import { describe, expect, it } from "vitest";
import {
  normalize,
  parseAmount,
  convert,
  MarketSnapshotSchema,
  alertMatches,
  isStale,
  isFetchFresh,
  observationOf,
  formatNumber,
  formatAmount,
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
  it("formats a fractional-Toman quote without float noise", () => {
    // TGJU quotes one IQD in Rial: 1486 IRR is 148.6 Toman, never 148.60000000003.
    expect(formatNumber(1486 / 10, false, 2)).toBe("148.6");
    expect(formatNumber(1486 / 10 - 1479 / 10, false, 2)).toBe("0.7");
  });
  it("never rounds a real conversion down to zero", () => {
    // 1 Toman in dollars at 233,300: 0.0000042863...
    expect(formatAmount(1 / 233_300, false)).toBe("0.000004286");
    expect(formatAmount(1 / 233_300, true)).toBe("۰٫۰۰۰۰۰۴۲۸۶");
    expect(formatAmount(0.5, false)).toBe("0.5");
    expect(formatAmount(233_300, false)).toBe("233,300");
    expect(formatAmount(1.23456, false)).toBe("1.2346");
    expect(formatAmount(0, false)).toBe("0");
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
it("fires a rapid-move alert on a live TGJU quote", () => {
  const alert = {
    id: "r",
    currency: "USD" as const,
    kind: "rapid" as const,
    threshold: 1,
    enabled: true,
    triggeredAt: null,
  };
  const now = Date.now();
  // The previous poll was a fresh retrieval even though `isStale` is always true.
  const previous = observationOf({ ...quote, fetchedAt: new Date(now - 60_000).toISOString() }, now);
  expect(previous.stale).toBe(false);
  const moved = { ...quote, priceToman: previous.priceToman * 1.02 };
  expect(alertMatches(alert, moved, previous, now)).toBe(true);
  // A small move, or a previous point older than five minutes, stays quiet.
  expect(alertMatches(alert, { ...quote, priceToman: previous.priceToman * 1.001 }, previous, now)).toBe(false);
  const old = observationOf({ ...quote, fetchedAt: new Date(now - 10 * 60_000).toISOString() }, now);
  expect(old.stale).toBe(true);
  expect(alertMatches(alert, moved, old, now)).toBe(false);
});
