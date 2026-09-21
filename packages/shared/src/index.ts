import { z } from "zod";

export const fiatCodes = ["USD", "EUR", "AED", "IQD"] as const;
export const CurrencySchema = z.enum(fiatCodes);
export type Currency = z.infer<typeof CurrencySchema>;
export const AssetSchema = z.enum([...fiatCodes, "USDT", "IRT"]);
export type Asset = z.infer<typeof AssetSchema>;
export type ConversionCurrency = Currency | "IRT" | "IRR";
export const names: Record<Asset | "IRR", string> = {
  USD: "دلار آمریکا",
  EUR: "یورو",
  AED: "درهم امارات",
  IQD: "دینار عراق",
  USDT: "تتر",
  IRT: "تومان",
  IRR: "ریال",
};
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
    source: z.literal("TGJU"),
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
    quotes: z.array(CurrencyQuoteSchema).length(4),
    fetchedAt: date,
    status: ProviderStatusSchema,
    message: z.string().optional(),
  })
  .refine(
    (s) => new Set(s.quotes.map((q) => q.currency)).size === 4,
    "Duplicate currencies",
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
export const PortfolioTransactionSchema = z.object({
  id: z.string().min(1),
  currency: AssetSchema,
  type: z.enum(["buy", "sell", "adjustment"]),
  quantity: positive,
  costToman: z.number().finite().nonnegative().max(1e15),
  timestamp: date,
});
export type PortfolioTransaction = z.infer<typeof PortfolioTransactionSchema>;
export interface PortfolioAsset {
  currency: Asset;
  quantity: number;
  averageCost: number;
  costBasis: number;
  realizedPnl: number;
}
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
export function formatNumber(value: number, persian = true, digits = 2) {
  return new Intl.NumberFormat(persian ? "fa-IR" : "en-US", {
    maximumFractionDigits: digits,
  }).format(value);
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
/** Adjustments set total quantity; costToman is the new average cost. Sells retain remaining average cost. */
export function calculatePortfolio(
  transactions: PortfolioTransaction[],
): PortfolioAsset[] {
  const assets = new Map<Asset, PortfolioAsset>();
  for (const tx of transactions) {
    PortfolioTransactionSchema.parse(tx);
    const a = assets.get(tx.currency) ?? {
      currency: tx.currency,
      quantity: 0,
      averageCost: 0,
      costBasis: 0,
      realizedPnl: 0,
    };
    if (tx.type === "adjustment") {
      a.quantity = tx.quantity;
      a.costBasis = tx.quantity * tx.costToman;
      a.averageCost = tx.quantity > 0 ? tx.costToman : 0;
    } else if (tx.type === "buy") {
      a.quantity += tx.quantity;
      a.costBasis += tx.quantity * tx.costToman;
      a.averageCost = a.quantity > 1e-9 ? a.costBasis / a.quantity : 0;
    } else {
      if (tx.quantity > a.quantity + 1e-9)
        throw new Error("مقدار فروش بیشتر از موجودی است");
      const sellQty = Math.min(tx.quantity, a.quantity);
      a.realizedPnl += sellQty * (tx.costToman - a.averageCost);
      a.costBasis -= sellQty * a.averageCost;
      a.quantity = Math.max(0, a.quantity - sellQty);
      if (a.quantity < 1e-9) {
        a.quantity = 0;
        a.costBasis = 0;
        a.averageCost = 0;
      } else {
        // Selling part of a position preserves the remaining average cost
        a.averageCost = a.costBasis / a.quantity;
      }
    }
    // Clean precision to prevent floating-point binary noise accumulation
    a.quantity = Math.round(a.quantity * 1e8) / 1e8;
    a.costBasis = Math.round(a.costBasis * 100) / 100;
    a.averageCost = Math.round(a.averageCost * 100) / 100;
    a.realizedPnl = Math.round(a.realizedPnl * 100) / 100;
    assets.set(tx.currency, a);
  }
  return [...assets.values()];
}
export function valuation(asset: PortfolioAsset, price: number | null) {
  if (price === null) return null;
  const value = Math.round(asset.quantity * price * 100) / 100;
  const pnl = Math.round((value - asset.costBasis) * 100) / 100;
  return {
    value,
    pnl,
    pnlPercent: asset.costBasis > 0 ? Math.round((pnl / asset.costBasis) * 10000) / 100 : null,
    breakEven: asset.averageCost,
  };
}
export function isStale(q: CurrencyQuote, now = Date.now()) {
  return (
    q.stale ||
    !q.sourceTimestamp ||
    now - Date.parse(q.sourceTimestamp) > 5 * 60_000 ||
    now - Date.parse(q.fetchedAt) > 5 * 60_000
  );
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
    isStale(q, now)
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
