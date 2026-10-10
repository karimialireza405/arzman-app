import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extraCodes } from "@arzman/shared";
import { overviewRow, parseOverview } from "../src/providers/tgju/overview";

const html = readFileSync("server/test/fixtures/overview.html", "utf8");
// The core USD quote the fixture was captured beside: 2,687,000 Rial.
const USD = 268_700;

describe("TGJU currency overview", () => {
  it("parses all 20 extra currencies, in Toman per one unit", () => {
    const failures: string[] = [];
    const quotes = parseOverview(html, USD, Date.now(), (c, m) =>
      failures.push(`${c}: ${m}`),
    );
    expect(failures).toEqual([]);
    expect(quotes.map((q) => q.currency)).toEqual([...extraCodes]);
    const gbp = quotes.find((q) => q.currency === "GBP")!;
    expect(gbp.priceToman).toBe(355_180);
    expect(gbp.previousToman).toBe(355_930); // "(0.21%) 7,500" with class low
    expect(gbp.lowToman).toBe(354_930);
    expect(gbp.highToman).toBe(360_220);
    expect(gbp.sourceUrl).toBe("https://www.tgju.org/profile/price_gbp");
    for (const q of quotes) {
      expect(q.rawUnit).toBe("IRR");
      expect(q.stale).toBe(true); // a clock-only label never proves a trade time
    }
  });

  it("reads the stated 100-yen lot and quotes one yen", () => {
    const jpy = parseOverview(html, USD).find((q) => q.currency === "JPY")!;
    expect(jpy.quoteSize).toBe(100);
    expect(jpy.priceToman).toBeCloseTo(1_697.43, 5);
  });

  it("signs the change from the row's direction class", () => {
    expect(overviewRow(html, "price_dollar_rl").change).toBe(4_000); // high
    expect(overviewRow(html, "price_eur").change).toBe(-12_800); // low
  });

  it("rejects the page when its USD row disagrees with the verified quote", () => {
    expect(() => parseOverview(html, USD * 10)).toThrow("disagrees");
    expect(() => parseOverview(html, USD / 10)).toThrow("disagrees");
  });

  it("rejects a page that is not the currency overview", () => {
    expect(() =>
      parseOverview(html.replace(/<title>[^<]*</, "<title>طلا<"), USD),
    ).toThrow("Wrong overview page");
  });

  it("drops a currency whose lot changed instead of guessing a divisor", () => {
    const changed = html.replace("ین ژاپن (100 ین)", "ین ژاپن (1000 ین)");
    const failures: string[] = [];
    const quotes = parseOverview(changed, USD, Date.now(), (c, m) =>
      failures.push(c + m),
    );
    expect(quotes.some((q) => q.currency === "JPY")).toBe(false);
    expect(quotes).toHaveLength(extraCodes.length - 1);
    expect(failures[0]).toMatch(/^JPY/);
  });

  it("drops a currency whose price moved by a lot factor", () => {
    const changed = html
      .replace(/data-price="54,700"/, 'data-price="5,470,000"')
      .replace('<td class="nf">54,700</td>', '<td class="nf">5,470,000</td>');
    const quotes = parseOverview(changed, USD);
    expect(quotes.some((q) => q.currency === "TRY")).toBe(false);
  });

  it("drops a row whose two price copies disagree", () => {
    const changed = html.replace(
      '<td class="nf">3,551,800</td>',
      '<td class="nf">3,551,900</td>',
    );
    expect(parseOverview(changed, USD).some((q) => q.currency === "GBP")).toBe(
      false,
    );
  });
});
