import { z } from "zod";

/**
 * The four currencies read from their own TGJU profile pages, each verified
 * by its unit row and per-unit FAQ. A snapshot is never published without
 * them, and the v1 API (old app installs) serves exactly these four.
 */
export const coreCodes = ["USD", "EUR", "AED", "IQD"] as const;
/** Read from TGJU's currency overview table, anchored to the core USD quote. */
export const extraCodes = [
  "GBP",
  "TRY",
  "CNY",
  "CAD",
  "AUD",
  "CHF",
  "JPY",
  "SAR",
  "QAR",
  "OMR",
  "KWD",
  "BHD",
  "RUB",
  "INR",
  "AFN",
  "AZN",
  "AMD",
  "GEL",
  "MYR",
  "THB",
] as const;
/** Display order: the currencies Iranians trade most come first. */
export const fiatCodes = [
  "USD",
  "EUR",
  "AED",
  "GBP",
  "TRY",
  "IQD",
  "CNY",
  "CAD",
  "AUD",
  "CHF",
  "JPY",
  "SAR",
  "QAR",
  "OMR",
  "KWD",
  "BHD",
  "RUB",
  "INR",
  "AFN",
  "AZN",
  "AMD",
  "GEL",
  "MYR",
  "THB",
] as const;
export const CurrencySchema = z.enum(fiatCodes);
export type Currency = z.infer<typeof CurrencySchema>;
export type CoreCurrency = (typeof coreCodes)[number];
export type ExtraCurrency = (typeof extraCodes)[number];
export const AssetSchema = z.enum([...fiatCodes, "USDT", "IRT"]);
export type Asset = z.infer<typeof AssetSchema>;
export type ConversionCurrency = Currency | "IRT" | "IRR";
export const names: Record<Asset | "IRR", string> = {
  USD: "دلار آمریکا",
  EUR: "یورو",
  AED: "درهم امارات",
  IQD: "دینار عراق",
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
  USDT: "تتر",
  IRT: "تومان",
  IRR: "ریال",
};
/** One-word names for tight places (the converter pill). */
export const shortNames: Record<ConversionCurrency, string> = {
  USD: "دلار",
  EUR: "یورو",
  AED: "درهم",
  IQD: "دینار",
  GBP: "پوند",
  TRY: "لیر",
  CNY: "یوان",
  CAD: "دلار کانادا",
  AUD: "دلار استرالیا",
  CHF: "فرانک",
  JPY: "ین",
  SAR: "ریال سعودی",
  QAR: "ریال قطر",
  OMR: "ریال عمان",
  KWD: "دینار کویت",
  BHD: "دینار بحرین",
  RUB: "روبل",
  INR: "روپیه",
  AFN: "افغانی",
  AZN: "منات",
  AMD: "درام",
  GEL: "لاری",
  MYR: "رینگیت",
  THB: "بات",
  IRT: "تومان",
  IRR: "ریال",
};
/**
 * Where a quote came from. TGJU is the primary source; BRSAPI is the fallback
 * the server uses only while TGJU is failing. Historical points are always TGJU.
 */
export const QuoteSourceSchema = z.enum(["TGJU", "BRSAPI"]);
export type QuoteSource = z.infer<typeof QuoteSourceSchema>;
const positive = z.number().finite().positive().max(1e15);
const date = z.iso.datetime();
export const CurrencyQuoteSchema = z
  .object({
    currency: CurrencySchema,
    nameFa: z.string(),
    priceToman: positive,
    rawValue: positive,
    rawUnit: z.enum(["IRR", "IRT"]),
    quoteSize: positive,
    normalizedTomanValue: positive,
    previousToman: positive.nullable(),
    change: z.number().finite().nullable(),
    changePercent: z.number().finite().nullable(),
    highToman: positive.nullable(),
    lowToman: positive.nullable(),
    source: QuoteSourceSchema,
    sourceUrl: z.url(),
    sourceTimestamp: date.nullable(),
    sourceTimeLabel: z.string(),
    fetchedAt: date,
    stale: z.boolean(),
  })
  .superRefine((q, ctx) => {
    const expected = q.rawValue / (q.rawUnit === "IRR" ? 10 : 1) / q.quoteSize;
    if (
      Math.abs(q.priceToman - expected) > 0.00001 ||
      q.priceToman !== q.normalizedTomanValue
    )
      ctx.addIssue({ code: "custom", message: "Inconsistent normalization" });
    if (
      q.lowToman !== null &&
      q.highToman !== null &&
      (q.lowToman > q.highToman ||
        q.priceToman < q.lowToman ||
        q.priceToman > q.highToman)
    )
      ctx.addIssue({ code: "custom", message: "Invalid daily bounds" });
    if (!q.stale && q.sourceTimestamp === null)
      ctx.addIssue({
        code: "custom",
        message: "Unknown timestamp cannot be live",
      });
  });
export type CurrencyQuote = z.infer<typeof CurrencyQuoteSchema>;
export const ProviderStatusSchema = z.enum(["ok", "stale", "unavailable"]);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;
export const MarketSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    quotes: z.array(CurrencyQuoteSchema).min(coreCodes.length),
    fetchedAt: date,
    status: ProviderStatusSchema,
    message: z.string().optional(),
  })
  .refine(
    (s) => new Set(s.quotes.map((q) => q.currency)).size === s.quotes.length,
    "Duplicate currencies",
  )
  .refine(
    (s) => coreCodes.every((c) => s.quotes.some((q) => q.currency === c)),
    "Missing core currency",
  );
export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;
export const HistoricalPointSchema = z.object({
  timestamp: date,
  priceToman: positive,
  source: z.literal("TGJU"),
  stale: z.boolean(),
});
export type HistoricalPoint = z.infer<typeof HistoricalPointSchema>;
export const HistorySchema = z.object({
  currency: CurrencySchema,
  range: z.string(),
  points: z.array(HistoricalPointSchema),
  kind: z.literal("observations"),
});
export const PriceAlertSchema = z.object({
  id: z.string(),
  currency: CurrencySchema,
  kind: z.enum(["above", "below", "percent", "rapid"]),
  threshold: positive,
  enabled: z.boolean(),
  triggeredAt: date.nullable(),
});
export type PriceAlert = z.infer<typeof PriceAlertSchema>;
export const CustomRateSchema = z.object({
  currency: AssetSchema,
  priceToman: positive,
  updatedAt: date,
});
export type CustomRate = z.infer<typeof CustomRateSchema>;

export function normalize(
  rawValue: number,
  rawUnit: "IRR" | "IRT",
  quoteSize: number,
) {
  positive.parse(rawValue);
  positive.parse(quoteSize);
  if (rawUnit !== "IRR" && rawUnit !== "IRT")
    throw new Error("Unknown source unit");
  return rawValue / (rawUnit === "IRR" ? 10 : 1) / quoteSize;
}
export function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
}
export function parseAmount(value: string): number {
  const cleaned = latinDigits(value)
    .replace(/[,٬\s]/g, "")
    .replace(/٫/g, ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) throw new Error("عدد معتبر وارد کنید");
  const result = Number(cleaned);
  if (!Number.isFinite(result) || result > 1e15)
    throw new Error("مقدار خارج از محدوده است");
  return result;
}
/** `minDigits` pads decimals (a column of percentages lines up); it never exceeds `digits`. */
export function formatNumber(
  value: number,
  persian = true,
  digits = 2,
  minDigits = 0,
) {
  return new Intl.NumberFormat(persian ? "fa-IR" : "en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(minDigits, digits),
  }).format(value);
}
/**
 * A converted amount, readable at any magnitude. Four decimals are enough for
 * "۲۳۳٬۳۰۰" but turn 1 Toman in dollars (0.0000042863) into "0", which is
 * simply wrong; below 1, keep enough decimals for four significant digits.
 */
export function formatAmount(value: number, persian = true, significant = 4) {
  const magnitude = Math.abs(value);
  if (magnitude === 0 || magnitude >= 1) return formatNumber(value, persian, 4);
  const decimals = Math.min(
    12,
    Math.ceil(-Math.log10(magnitude)) + significant - 1,
  );
  return formatNumber(value, persian, decimals);
}
export function convert(
  amount: number,
  from: ConversionCurrency,
  to: ConversionCurrency,
  quotes: CurrencyQuote[],
) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Invalid amount");
  const rate = (c: ConversionCurrency) => {
    if (c === "IRT") return 1;
    if (c === "IRR") return 0.1;
    const q = quotes.find((q) => q.currency === c);
    if (!q) throw new Error("نرخ در دسترس نیست");
    return q.priceToman;
  };
  return (amount * rate(from)) / rate(to);
}
/**
 * Display freshness: can ArzMan vouch for the *trade time* behind this price?
 * TGJU publishes a clock-only label ("۱۹:۵۹:۵۸"), which never establishes an
 * exact trade timestamp, so live TGJU quotes are always reported as unverified.
 */
export function isStale(q: CurrencyQuote, now = Date.now()) {
  return (
    q.stale ||
    !q.sourceTimestamp ||
    now - Date.parse(q.sourceTimestamp) > 5 * 60_000 ||
    !isFetchFresh(q, now)
  );
}
/**
 * Retrieval freshness: did ArzMan itself read this price from the source
 * recently? A cache served after an upstream failure keeps its original
 * `fetchedAt`, so it ages out of this window instead of masquerading as live.
 * This — not `isStale` — is the correct gate for acting on a price, because
 * `isStale` is permanently true for TGJU and would disable alerts entirely.
 */
export function isFetchFresh(q: CurrencyQuote, now = Date.now()) {
  return now - Date.parse(q.fetchedAt) <= 5 * 60_000;
}
/**
 * The previous-observation point a "rapid move" alert compares against.
 * `stale` here means "not freshly retrieved", never `isStale`: that is always
 * true for TGJU, which would make rapid alerts unreachable.
 */
export function observationOf(
  q: CurrencyQuote,
  now = Date.now(),
): HistoricalPoint {
  return {
    timestamp: q.fetchedAt,
    priceToman: q.priceToman,
    source: "TGJU",
    stale: !isFetchFresh(q, now),
  };
}
export function alertMatches(
  alert: PriceAlert,
  q: CurrencyQuote,
  previous?: HistoricalPoint,
  now = Date.now(),
) {
  if (
    !alert.enabled ||
    alert.triggeredAt ||
    q.currency !== alert.currency ||
    !isFetchFresh(q, now)
  )
    return false;
  if (alert.kind === "above") return q.priceToman > alert.threshold;
  if (alert.kind === "below") return q.priceToman < alert.threshold;
  if (alert.kind === "percent")
    return (
      q.changePercent !== null && Math.abs(q.changePercent) >= alert.threshold
    );
  return (
    !!previous &&
    !previous.stale &&
    now - Date.parse(previous.timestamp) <= 5 * 60_000 &&
    Math.abs((q.priceToman / previous.priceToman - 1) * 100) >= alert.threshold
  );
}
export interface MarketDataProvider {
  readonly name: string;
  fetchSnapshot(): Promise<MarketSnapshot>;
}
export interface CryptoPriceProvider {
  fetchUsdtToman(): Promise<{
    priceToman: number;
    source: string;
    timestamp: string;
  }>;
}
