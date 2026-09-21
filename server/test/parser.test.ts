import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseTgju, parseSourceTimestamp } from "../src/providers/tgju";
import { CurrencyQuoteSchema, fiatCodes } from "@arzman/shared";
const fixture = (code: string) =>
  readFileSync(`server/test/fixtures/${code.toLowerCase()}.html`, "utf8");
describe("TGJU captured fixtures", () => {
  for (const code of fiatCodes)
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
  it("does not invent timestamps and rejects future timestamps", () => {
    expect(parseSourceTimestamp("۱۲:۳۰:۰۰", Date.now())).toBeNull();
    expect(() =>
      parseSourceTimestamp("2099-01-01T00:00:00Z", Date.now()),
    ).toThrow();
  });
});
