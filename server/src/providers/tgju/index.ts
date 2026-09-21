import { load } from "cheerio";
import {
  CurrencyQuoteSchema,
  MarketSnapshotSchema,
  fiatCodes,
  names,
  normalize,
  parseAmount,
  latinDigits,
  type Currency,
  type MarketDataProvider,
} from "@arzman/shared";

export const profiles: Record<Currency, string> = {
  USD: "price_dollar_rl",
  EUR: "price_eur",
  AED: "price_aed",
  IQD: "price_iqd",
};
const sourceNames: Record<Currency, string> = {
  USD: "دلار",
  EUR: "یورو",
  AED: "درهم امارات",
  IQD: "دینار عراق",
};
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** A time-only or day/month-only label does not establish an exact trade timestamp. */
export function parseSourceTimestamp(
  label: string,
  now: number,
): string | null {
  const text = latinDigits(label);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      text,
    )
  )
    return null;
  const ts = Date.parse(text);
  if (!Number.isFinite(ts) || ts > now + 60_000)
    throw new Error("Invalid source timestamp");
  return new Date(ts).toISOString();
}
export function parseTgju(html: string, currency: Currency, now = Date.now()) {
  if (html.length > 2_000_000) throw new Error("Oversize page");
  const $ = load(html);
  const title = clean($("h1.title").first().text());
  if (!title.includes(sourceNames[currency]))
    throw new Error("Wrong currency profile");
  const unitRow = $("h3")
    .filter((_, el) => $(el).find(".label").text().includes("واحد پولی"))
    .first();
  const unit = clean(unitRow.find(".value").text());
  const rawUnit = unit === "ریال" ? "IRR" : unit === "تومان" ? "IRT" : null;
  if (!rawUnit) throw new Error("Unknown currency unit");
  // IQD & Fiat Quote Size Convention:
  // TGJU profile `price_iqd` explicitly quotes the price of single unit (1 IQD) in Rials (ریال).
  // Verified live on TGJU: FAQ states «قیمت هر دینار عراق...» and table unit says «ریال».
  // Example: raw 1,479 IRR = 147.9 Toman per 1 IQD (1,000 IQD = 147,900 Toman).
  // Quote size is strictly 1 unit; lot sizes (e.g. 100 or 1000) must never be guessed.
  const faq = $('[itemprop="text"]')
    .filter((_, el) =>
      clean($(el).text()).includes(`قیمت هر ${sourceNames[currency]}`),
    )
    .first();
  if (!faq.length) throw new Error("Missing per-unit quote evidence");
  const quoteSize = 1;
  const rows = new Map<string, string>();
  $("tr").each((_, el) => {
    const cells = $(el).find("td");
    if (cells.length === 2) {
      const key = clean(cells.eq(0).text());
      if (!rows.has(key)) rows.set(key, clean(cells.eq(1).text()));
    }
  });
  const primary = clean(
    $('[data-col="info.last_trade.PDrCotVal"]').first().text(),
  );
  const alternative = rows.get("نرخ فعلی");
  const rawValue = parseAmount(primary || alternative || "");
  if (primary && alternative && rawValue !== parseAmount(alternative))
    throw new Error("Conflicting current prices");
  const faqPrice = clean(faq.find(".price").text())
    .replace(/ریال|تومان/g, "")
    .trim();
  if (faqPrice && parseAmount(faqPrice) !== rawValue)
    throw new Error("Conflicting FAQ price");
  const field = (label: string) => {
    const s = rows.get(label);
    return !s || s === "-"
      ? null
      : normalize(parseAmount(s), rawUnit, quoteSize);
  };
  const priceToman = normalize(rawValue, rawUnit, quoteSize);
  // Wide bounds detect decimal/lot regressions without prescribing a market price.
  if (
    priceToman < (currency === "IQD" ? 0.1 : 100) ||
    priceToman > (currency === "IQD" ? 1e6 : 1e9)
  )
    throw new Error("Price outside sanity bounds");
  const previousToman = field("نرخ روز گذشته");
  const sourceTimeLabel = rows.get("زمان ثبت آخرین نرخ") || "نامشخص";
  const sourceTimestamp = parseSourceTimestamp(sourceTimeLabel, now);
  return CurrencyQuoteSchema.parse({
    currency,
    nameFa: names[currency],
    priceToman,
    rawValue,
    rawUnit,
    quoteSize,
    normalizedTomanValue: priceToman,
    previousToman,
    change: previousToman === null ? null : priceToman - previousToman,
    changePercent:
      previousToman === null ? null : (priceToman / previousToman - 1) * 100,
    highToman: field("بالاترین قیمت روز"),
    lowToman: field("پایین ترین قیمت روز"),
    source: "TGJU",
    sourceUrl: `https://www.tgju.org/profile/${profiles[currency]}`,
    sourceTimestamp,
    sourceTimeLabel,
    fetchedAt: new Date(now).toISOString(),
    stale:
      sourceTimestamp === null || now - Date.parse(sourceTimestamp) > 300_000,
  });
}
export class TGJUProvider implements MarketDataProvider {
  readonly name = "TGJU";
  constructor(
    private readonly fetcher: typeof fetch = (input, init) =>
      fetch(input, init),
  ) {}
  async fetchSnapshot() {
    const quotes = [];
    // Sequential, bounded public requests; no challenge handling or private endpoints.
    for (const currency of fiatCodes) {
      const response = await this.fetcher(
        `https://www.tgju.org/profile/${profiles[currency]}`,
        {
          signal: AbortSignal.timeout(12_000),
          headers: {
            Accept: "text/html",
            "User-Agent": "ArzMan/0.1 personal market dashboard",
          },
        },
      );
      if (!response.ok) throw new Error(`TGJU HTTP ${response.status}`);
      if (Number(response.headers.get("content-length") || 0) > 2_000_000)
        throw new Error("Oversize response");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Empty source response");
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.length;
          if (size > 2_000_000) throw new Error("Oversize response");
          chunks.push(part.value);
        }
      } finally {
        await reader.cancel();
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      quotes.push(parseTgju(new TextDecoder().decode(bytes), currency));
    }
    return MarketSnapshotSchema.parse({
      schemaVersion: 1,
      quotes,
      fetchedAt: new Date().toISOString(),
      status: quotes.some((q) => q.stale) ? "stale" : "ok",
    });
  }
}
