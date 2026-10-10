import {
  DAILY_HISTORY_QUERY,
  DAY_LENGTH,
  HISTORY_QUERY,
  HOURLY_HISTORY_QUERY,
  HOUR_LENGTH,
} from "./sql";

export const RANGE_MS: Record<string, number> = {
  "1H": 3600_000,
  "1D": 86400_000,
  "1W": 7 * 86400_000,
  "1M": 30 * 86400_000,
  "3M": 90 * 86400_000,
  "1Y": 365 * 86400_000,
};

/** Raw observations are kept only as long as the shortest range that needs them. */
export const RAW_RETENTION_MS = 8 * 86400_000;
export const HOURLY_RETENTION_MS = 100 * 86400_000;
export const DAILY_RETENTION_MS = 366 * 86400_000;

export interface HistoryPlan {
  sql: string;
  /** Lower bound on the table's time column (ISO, or an ISO prefix for rollups). */
  cutoff: string;
  bucketMs: number;
}

/**
 * Which table answers a range. 1H and 1D read raw rows (at most ~1,900 per
 * currency); 1W to 3M read the hourly rollup (at most ~2,200); 1Y reads the
 * daily one (~365). Nothing here may scan a window's raw rows for a long range.
 */
export function planHistory(range: string, now: number): HistoryPlan | null {
  const length = RANGE_MS[range];
  if (length === undefined) return null;
  // One real observation per bucket, about 240 points per chart.
  const bucketMs = Math.max(300_000, Math.ceil(length / 240));
  const iso = new Date(now - length).toISOString();
  if (length <= RANGE_MS["1D"])
    return { sql: HISTORY_QUERY, cutoff: iso, bucketMs };
  if (length <= RANGE_MS["3M"])
    return {
      sql: HOURLY_HISTORY_QUERY,
      cutoff: iso.slice(0, HOUR_LENGTH),
      bucketMs,
    };
  return {
    sql: DAILY_HISTORY_QUERY,
    cutoff: iso.slice(0, DAY_LENGTH),
    bucketMs,
  };
}

/** ISO bucket keys for an observation time. */
export const hourBucket = (timestamp: string) =>
  new Date(timestamp).toISOString().slice(0, HOUR_LENGTH);
export const dayBucket = (timestamp: string) =>
  new Date(timestamp).toISOString().slice(0, DAY_LENGTH);

/**
 * How long a computed history response is reused before the store is queried
 * again. A long range barely moves in a minute, and every miss costs rows read.
 */
export const HISTORY_TTL_MS: Record<string, number> = {
  "1H": 30_000,
  "1D": 60_000,
  "1W": 5 * 60_000,
  "1M": 15 * 60_000,
  "3M": 30 * 60_000,
  "1Y": 60 * 60_000,
};

export class TtlCache<V> {
  private entries = new Map<string, { expires: number; value: V }>();
  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxEntries = 512,
  ) {}
  get(key: string): V | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return hit.value;
  }
  set(key: string, value: V, ttlMs: number) {
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { expires: this.now() + ttlMs, value });
  }
}
