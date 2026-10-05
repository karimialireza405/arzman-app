import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseTgju, parseSourceTimestamp } from "../src/providers/tgju";
import { CurrencyQuoteSchema, coreCodes } from "@arzman/shared";
const fixture = (code: string) =>
  readFileSync(`server/test/fixtures/${code.toLowerCase()}.html`, "utf8");
describe("TGJU captured fixtures", () => {
  for (const code of coreCodes)
    it(`parses ${code} with metadata and semantic fallback`, () => {
      const html = fixture(code);
      const q = parseTgju(html, code);
      expect(q.rawUnit).toBe("IRR");
      expect(q.quoteSize).toBe(1);
      expect(q.priceToman).toBe(q.rawValue / 10);
      expect(q.stale).toBe(true);
      expect(q.sourceTimestamp).toBeNull();
      const alternative = parseTgju(
        html.replace(
          /data-col="info.last_trade.PDrCotVal"/g,
          'data-old="price"',
        ),
        code,
      );
      expect(alternative.priceToman).toBe(q.priceToman);
    });
  it("uses one IQD, not a hundred IQD", () => {
    const q = parseTgju(fixture("IQD"), "IQD");
    expect(q.currency).toBe("IQD");
    expect(q.rawValue).toBe(1479);
    expect(q.rawUnit).toBe("IRR");
    expect(q.quoteSize).toBe(1);
    expect(q.priceToman).toBe(147.9);
    expect(q.normalizedTomanValue).toBe(147.9);
    // If TGJU changed convention to 100 dinars without updating parser, it must fail
    const html100 = fixture("IQD").replace("قیمت هر", "قیمت صد");
    expect(() => parseTgju(html100, "IQD")).toThrow("Missing per-unit quote evidence");
  });
  it("fails closed for changed units, missing quote evidence, currency and corrupted price", () => {
    const html = fixture("USD");
    expect(() =>
      parseTgju(html.replace(">ریال<", ">نامشخص<"), "USD"),
    ).toThrow();
    expect(() =>
      parseTgju(html.replace("قیمت هر", "قیمت صد"), "USD"),
    ).toThrow();
    expect(() => parseTgju(html, "EUR")).toThrow();
    expect(() => parseTgju(html.replace("2,306,000", "0"), "USD")).toThrow();
  });
  it("rejects contradictory normalization at the client boundary", () => {
    const q = parseTgju(fixture("USD"), "USD");
    expect(
      CurrencyQuoteSchema.safeParse({ ...q, priceToman: q.rawValue }).success,
    ).toBe(false);
    expect(CurrencyQuoteSchema.safeParse({ ...q, highToman: 1 }).success).toBe(
      false,
    );
  });
  /**
   * Live audit, 2026-09-22: TGJU renders the FAQ sentence from a slower cache
   * than the quote table, so during trading hours its number legitimately lags
   * the main quote. Requiring equality made the parser reject valid USD, EUR
   * and AED quotes and took the whole snapshot down with them.
   */
  describe("FAQ is corroborating evidence, not a price oracle", () => {
    const faq = (value: string) =>
      fixture("USD").replace(
        /(<span class="price">)[^<]*(<\/span>)/,
        `$1${value}$2`,
      );
    it("accepts a FAQ number that lags the authoritative quote", () => {
      const q = parseTgju(faq("2,301,500 ریال"), "USD");
      expect(q.rawValue).toBe(2_306_000);
      expect(q.priceToman).toBe(230_600);
    });
    it("still rejects a FAQ that contradicts the quote's magnitude", () => {
      expect(() => parseTgju(faq("23,060,000 ریال"), "USD")).toThrow(
        "FAQ contradicts quote magnitude",
      );
      expect(() => parseTgju(faq("230,600 ریال"), "USD")).toThrow(
        "FAQ contradicts quote magnitude",
      );
    });
    it("still rejects a FAQ published in a different unit than the table", () => {
      expect(() => parseTgju(faq("2,306,000 تومان"), "USD")).toThrow(
        "Conflicting quote unit",
      );
    });
  });
  it("rejects a quote that cannot plausibly follow the previous close", () => {
    const previous = (value: string) =>
      fixture("USD").replace(
        /(نرخ روز گذشته<\/td>\s*<td class="text-left">)[^<]*/,
        `$1${value}`,
      );
    expect(parseTgju(previous("2,290,000"), "USD").previousToman).toBe(229_000);
    expect(() => parseTgju(previous("306,000"), "USD")).toThrow(
      "Implausible move against previous close",
    );
  });
  it("does not invent timestamps and rejects future timestamps", () => {
    expect(parseSourceTimestamp("۱۲:۳۰:۰۰", Date.now())).toBeNull();
    expect(() =>
      parseSourceTimestamp("2099-01-01T00:00:00Z", Date.now()),
    ).toThrow();
  });
});
