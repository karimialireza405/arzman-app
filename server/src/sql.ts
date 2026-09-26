import { fiatCodes } from "@arzman/shared";

/**
 * SQL for the observation store.
 *
 * Cloudflare bills a SQLite-backed Durable Object by rows *read*, and a row a
 * query scans counts even when it changes nothing. On the Workers Free plan the
 * budget is 5,000,000 rows read per day, and once it is spent every storage
 * operation fails until 00:00 UTC. Every statement here must therefore reach its
 * rows through the (currency, timestamp) primary key — see sql.test.ts, which
 * checks the query plans.
 */
export const OBSERVATIONS_SCHEMA =
  "CREATE TABLE IF NOT EXISTS observations (currency TEXT NOT NULL, timestamp TEXT NOT NULL, price REAL NOT NULL, stale INTEGER NOT NULL, PRIMARY KEY(currency,timestamp))";

export const INSERT_OBSERVATION =
  "INSERT OR IGNORE INTO observations VALUES (?, ?, ?, ?)";

/**
 * Retention. The previous `WHERE timestamp < ?` could not use the primary key
 * (currency comes first), so it scanned the whole table on every 45-second
 * refresh: tens of millions of rows a day by the sixth day, which exhausted the
 * free budget within ~90 minutes of each reset and took the API down. Naming
 * the currencies lets SQLite seek straight to the expired rows.
 */
export const RETENTION_DELETE = `DELETE FROM observations WHERE currency IN (${fiatCodes
  .map(() => "?")
  .join(", ")}) AND timestamp < ?`;
export const retentionParams = (cutoffIso: string) => [...fiatCodes, cutoffIso];

/** One real observation per time bucket; missing data is never interpolated. */
export const HISTORY_QUERY =
  "SELECT timestamp, price, stale FROM observations WHERE currency = ? AND timestamp >= ? GROUP BY CAST(unixepoch(timestamp) * 1000 / ? AS INTEGER) HAVING timestamp = MAX(timestamp) ORDER BY timestamp";
