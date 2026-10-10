import {
  CurrencyQuoteSchema,
  MarketSnapshotSchema,
  coreCodes,
  names,
  normalize,
  parseAmount,
  type CoreCurrency,
  type MarketDataProvider,
  type MarketSnapshot,
} from "@arzman/shared";

/**
 * Fallback price source, used only while TGJU is failing (see MarketStore).
 *
 * It reads BRSAPI's free JSON endpoint and needs an API key, so it is off until
 * the owner sets the `BRSAPI_KEY` secret. The response shape below
 * (`currency[]` of `{symbol, price, unit, time_unix, ...}`) follows BRSAPI's
 * public docs and has NOT been verified against the live service from CI, so
 * everything is fail-closed: any surprise throws and the fallback is simply
 * not used.
 *
 * Because its quote size and unit cannot be proven the way TGJU's FAQ block
 * proves them, every price must also agree with the last TGJU snapshot to
 * within a factor of two. That catches a 10x unit or 1000x lot-size mistake
 * (the way IQD is usually mis-quoted) without us ever guessing a price.
 */
export const BRSAPI_URL = "https://brsapi.ir/Api/Market/Gold_Currency.php";
const MAX_BYTES = 2_000_000;

interface Row {
  symbol?: unknown;
  price?: unknown;
  unit?: unknown;
  change_value?: unknown;
  date?: unknown;
  time?: unknown;
  time_unix?: unknown;
}
const num = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  try {
    return parseAmount(v);
  } catch {
    return null;
  }
};

export function parseBrsApi(
  body: unknown,
  reference: MarketSnapshot,
  now = Date.now(),
): MarketSnapshot {
  const rows = (body as { currency?: unknown })?.currency;
  if (!Array.isArray(rows)) throw new Error("BRSAPI: missing currency list");
  const quotes = coreCodes.map((code: CoreCurrency) => {
    const matches = (rows as Row[]).filter(
      (r) => typeof r?.symbol === "string" && r.symbol.toUpperCase() === code,
    );
    if (matches.length !== 1)
      throw new Error(`BRSAPI: ${code} found ${matches.length} times`);
    const row = matches[0];
    const rawUnit =
      row.unit === "تومان" ? "IRT" : row.unit === "ریال" ? "IRR" : null;
    if (!rawUnit) throw new Error(`BRSAPI: unknown unit for ${code}`);
    const rawValue = num(row.price);
    if (rawValue === null || rawValue <= 0)
      throw new Error(`BRSAPI: bad price for ${code}`);
    const priceToman = normalize(rawValue, rawUnit, 1);
    const anchor = reference.quotes.find((q) => q.currency === code);
    if (!anchor) throw new Error(`BRSAPI: no TGJU reference for ${code}`);
    const ratio = priceToman / anchor.priceToman;
    if (!(ratio >= 0.5 && ratio <= 2))
      throw new Error(`BRSAPI: ${code} contradicts TGJU magnitude`);

    const unix = num(row.time_unix);
    const ts = unix === null ? null : unix * 1000;
    if (ts !== null && ts > now + 60_000)
      throw new Error(`BRSAPI: ${code} timestamp in the future`);
    const sourceTimestamp = ts === null ? null : new Date(ts).toISOString();
    const change = num(row.change_value);
    const previous = change === null ? null : normalize(rawValue, rawUnit, 1) - change;
    const hasPrev = previous !== null && previous > 0 && priceToman / previous <= 2 && priceToman / previous >= 0.5;
    return CurrencyQuoteSchema.parse({
      currency: code,
      nameFa: names[code],
      priceToman,
      rawValue,
      rawUnit,
      quoteSize: 1,
      normalizedTomanValue: priceToman,
      previousToman: hasPrev ? previous : null,
      change: hasPrev ? priceToman - previous : null,
      changePercent: hasPrev ? (priceToman / previous - 1) * 100 : null,
      highToman: null,
      lowToman: null,
      source: "BRSAPI",
      sourceUrl: "https://brsapi.ir",
      sourceTimestamp,
      sourceTimeLabel:
        typeof row.date === "string" && typeof row.time === "string"
          ? `${row.date} ${row.time}`
          : "نامشخص",
      fetchedAt: new Date(now).toISOString(),
      stale: sourceTimestamp === null || now - ts! > 300_000,
    });
  });
  return MarketSnapshotSchema.parse({
    schemaVersion: 1,
    quotes,
    fetchedAt: new Date(now).toISOString(),
    status: quotes.some((q) => q.stale) ? "stale" : "ok",
  });
}

export class BrsApiProvider implements MarketDataProvider {
  readonly name = "BRSAPI";
  constructor(
    private readonly apiKey: string,
    private readonly reference: () => Promise<MarketSnapshot | undefined>,
    private readonly fetcher: typeof fetch = (input, init) => fetch(input, init),
  ) {}
  async fetchSnapshot() {
    const reference = await this.reference();
    if (!reference) throw new Error("BRSAPI: no TGJU reference snapshot yet");
    const response = await this.fetcher(
      `${BRSAPI_URL}?key=${encodeURIComponent(this.apiKey)}`,
      {
        signal: AbortSignal.timeout(12_000),
        headers: { Accept: "application/json", "User-Agent": "ArzMan/0.1" },
      },
    );
    if (!response.ok) throw new Error(`BRSAPI HTTP ${response.status}`);
    const text = await response.text();
    if (text.length > MAX_BYTES) throw new Error("BRSAPI: oversize response");
    return parseBrsApi(JSON.parse(text), reference);
  }
}
