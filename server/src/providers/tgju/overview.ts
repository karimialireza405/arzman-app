/**
 * The 20 extra currencies, read from TGJU's currency overview
 * (https://www.tgju.org/currency) in one request instead of 20 profile pages.
 *
 * The overview carries less evidence than a profile page: no unit row and no
 * per-unit FAQ. Every value is therefore anchored before it is accepted:
 * - Unit: the overview's own USD row must agree with the core USD quote, which
 *   the profile parser has just verified as Rial. Same page, same unit.
 * - Quote size: the only lot TGJU states is in the name ("ین ژاپن (100 ین)");
 *   a name with any other number is rejected rather than guessed.
 * - Magnitude: each currency's implied USD cross rate must sit within a factor
 *   of three of its long-run value, which catches a 10× or 100× lot change
 *   without prescribing a market price.
 * A currency that fails its own checks is dropped and logged; the rest stand.
 * A page that fails the anchor or structure checks is rejected whole.
 *
 * The page is ~3.6 MB but every market row sits in its first ~250 KB, so the
 * reader stops as soon as all rows have arrived. Rows are cut out by string
 * search, not a DOM parser, to keep CPU time flat on the Worker.
 */
import {
  CurrencyQuoteSchema,
  extraCodes,
  latinDigits,
  names,
  normalize,
  parseAmount,
  type CurrencyQuote,
  type ExtraCurrency,
} from "@arzman/shared";
import { parseSourceTimestamp } from "./index";

export const OVERVIEW_URL = "https://www.tgju.org/currency";
const USD_SLUG = "price_dollar_rl";

export const overviewProfiles: Record<ExtraCurrency, string> = Object.fromEntries(
  extraCodes.map((c) => [c, `price_${c.toLowerCase()}`]),
) as Record<ExtraCurrency, string>;

/** The name TGJU prints in the row, which must appear for the row to be trusted. */
const sourceNames: Record<ExtraCurrency, string> = {
  GBP: "پوند انگلیس",
  TRY: "لیر ترکیه",
  CNY: "یوان چین",
  CAD: "دلار کانادا",
  AUD: "دلار استرالیا",
  CHF: "فرانک سوئیس",
  JPY: "ین ژاپن",
  SAR: "ریال عربستان",
  QAR: "ریال قطر",
  OMR: "ریال عمان",
  KWD: "دینار کویت",
  BHD: "دینار بحرین",
  RUB: "روبل روسیه",
  INR: "روپیه هند",
  AFN: "افغانی",
  AZN: "منات آذربایجان",
  AMD: "درام ارمنستان",
  GEL: "لاری گرجستان",
  MYR: "رینگیت مالزی",
  THB: "بات تایلند",
};

/** US dollars per one unit, long-run. Only used as a factor-of-three guard. */
const usdPerUnit: Record<ExtraCurrency, number> = {
  GBP: 1.3,
  TRY: 0.025,
  CNY: 0.14,
  CAD: 0.72,
  AUD: 0.66,
  CHF: 1.15,
  JPY: 0.0068,
  SAR: 0.267,
  QAR: 0.275,
  OMR: 2.6,
  KWD: 3.26,
  BHD: 2.65,
  RUB: 0.012,
  INR: 0.0115,
  AFN: 0.0145,
  AZN: 0.59,
  AMD: 0.0026,
  GEL: 0.37,
  MYR: 0.23,
  THB: 0.03,
};

const clean = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export interface OverviewRow {
  name: string;
  price: number;
  /** Signed change against yesterday, in the page's unit. */
  change: number;
  changePercent: number;
  low: number | null;
  high: number | null;
  timeLabel: string;
}

/** Cut one market row out of the page. Throws if it is absent or malformed. */
export function overviewRow(html: string, slug: string): OverviewRow {
  const start = html.indexOf(`<tr data-market-nameslug="${slug}"`);
  if (start < 0) throw new Error(`Missing overview row ${slug}`);
  const end = html.indexOf("</tr>", start);
  if (end < 0) throw new Error(`Truncated overview row ${slug}`);
  const row = html.slice(start, end);
  // Skip the tooltip attribute (it contains markup); cells follow the tag.
  const body = row.slice(row.indexOf(">", row.indexOf("data-price=")) + 1);
  const cells = [...body.matchAll(/<t([hd])[^>]*>([\s\S]*?)<\/t\1>/g)].map((m) => m[2]);
  if (cells.length < 6) throw new Error(`Unexpected overview row ${slug}`);
  const dataPrice = /data-price="([^"]*)"/.exec(row)?.[1] ?? "";
  const price = parseAmount(clean(cells[1]));
  if (parseAmount(dataPrice) !== price) throw new Error(`Conflicting overview price ${slug}`);
  const changeText = latinDigits(clean(cells[2]));
  const changeMatch = /^\(([\d.]+)%\)\s*([\d,]+)$/.exec(changeText);
  if (!changeMatch) throw new Error(`Unreadable overview change ${slug}`);
  const direction = /class="(low|high)"/.exec(cells[2])?.[1];
  const magnitude = parseAmount(changeMatch[2]);
  if (magnitude !== 0 && !direction) throw new Error(`Unsigned overview change ${slug}`);
  const sign = direction === "low" ? -1 : 1;
  const bound = (cell: string) => {
    const text = clean(cell);
    return !text || text === "-" ? null : parseAmount(text);
  };
  return {
    name: clean(cells[0]),
    price,
    change: sign * magnitude,
    changePercent: sign * Number(changeMatch[1]),
    low: bound(cells[3]),
    high: bound(cells[4]),
    timeLabel: clean(cells[5]) || "نامشخص",
  };
}

export function overviewSlugs() {
  return [USD_SLUG, ...extraCodes.map((c) => overviewProfiles[c])];
}

/**
 * Parse the extras from the overview page.
 * @param usdToman the core USD quote, verified moments earlier from its profile page.
 */
export function parseOverview(
  html: string,
  usdToman: number,
  now = Date.now(),
  log: (code: ExtraCurrency, message: string) => void = () => {},
): CurrencyQuote[] {
  if (!/<title>[^<]*نرخ ارز/.test(html)) throw new Error("Wrong overview page");
  if (!html.includes("قیمت زنده") || !html.includes("تغییر"))
    throw new Error("Unexpected overview layout");
  // The anchor: the page's USD row is in Rial, as the profile page proved.
  const usd = overviewRow(html, USD_SLUG);
  const anchor = normalize(usd.price, "IRR", 1) / usdToman;
  if (!(anchor >= 0.97 && anchor <= 1.03))
    throw new Error("Overview disagrees with the verified USD quote");

  const quotes: CurrencyQuote[] = [];
  for (const currency of extraCodes) {
    try {
      const row = overviewRow(html, overviewProfiles[currency]);
      if (!row.name.includes(sourceNames[currency])) throw new Error("Wrong currency row");
      const lot = latinDigits(row.name).match(/\d+/g);
      const quoteSize =
        currency === "JPY" && lot?.length === 1 && lot[0] === "100" ? 100 : lot ? NaN : 1;
      if (!Number.isFinite(quoteSize)) throw new Error(`Unrecognised lot in "${row.name}"`);
      const priceToman = normalize(row.price, "IRR", quoteSize);
      const cross = priceToman / usdToman / usdPerUnit[currency];
      if (!(cross >= 1 / 3 && cross <= 3)) throw new Error("Implausible USD cross rate");
      const previousRaw = row.price - row.change;
      if (!(previousRaw > 0)) throw new Error("Implausible previous price");
      const previousToman = normalize(previousRaw, "IRR", quoteSize);
      // TGJU rounds the percentage; a disagreement beyond rounding means the
      // two numbers were not taken against the same previous close.
      const percent = (row.change / previousRaw) * 100;
      if (Math.abs(percent - row.changePercent) > 0.1 + Math.abs(row.changePercent) * 0.05)
        throw new Error("Change and percentage disagree");
      let lowToman = row.low === null ? null : normalize(row.low, "IRR", quoteSize);
      let highToman = row.high === null ? null : normalize(row.high, "IRR", quoteSize);
      // The day's range is published on its own clock; if it does not contain
      // the live price, it is not shown rather than shown wrong.
      if (
        lowToman === null ||
        highToman === null ||
        lowToman > highToman ||
        priceToman < lowToman ||
        priceToman > highToman
      )
        lowToman = highToman = null;
      const sourceTimestamp = parseSourceTimestamp(row.timeLabel, now);
      quotes.push(
        CurrencyQuoteSchema.parse({
          currency,
          nameFa: names[currency],
          priceToman,
          rawValue: row.price,
          rawUnit: "IRR",
          quoteSize,
          normalizedTomanValue: priceToman,
          previousToman,
          change: priceToman - previousToman,
          changePercent: (priceToman / previousToman - 1) * 100,
          highToman,
          lowToman,
          source: "TGJU",
          sourceUrl: `https://www.tgju.org/profile/${overviewProfiles[currency]}`,
          sourceTimestamp,
          sourceTimeLabel: row.timeLabel,
          fetchedAt: new Date(now).toISOString(),
          stale: sourceTimestamp === null || now - Date.parse(sourceTimestamp) > 300_000,
        }),
      );
    } catch (error) {
      log(currency, error instanceof Error ? error.message : "Unknown error");
    }
  }
  return quotes;
}

/** Read the overview, stopping once every needed row has arrived. */
export async function fetchOverviewHtml(fetcher: typeof fetch): Promise<string> {
  const response = await fetcher(OVERVIEW_URL, {
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: "text/html", "User-Agent": "ArzMan/0.1 personal market dashboard" },
  });
  if (!response.ok) throw new Error(`TGJU overview HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty overview response");
  const decoder = new TextDecoder();
  const slugs = overviewSlugs().map((s) => `<tr data-market-nameslug="${s}"`);
  let html = "";
  try {
    while (html.length < 8_000_000) {
      const part = await reader.read();
      if (part.done) break;
      html += decoder.decode(part.value, { stream: true });
      const last = Math.max(...slugs.map((s) => html.indexOf(s)));
      if (slugs.every((s) => html.includes(s)) && html.indexOf("</tr>", last) > 0) break;
    }
  } finally {
    await reader.cancel();
  }
  return html;
}
