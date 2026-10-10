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

/**
 * Rollups. Long ranges used to read every raw observation in the window (about
 * 700k rows for one 1Y request at the active cadence). The last observation of
 * each hour and of each day is kept in two small tables instead, keyed by
 * (currency, bucket), so 3M reads at most ~2,200 rows and 1Y at most ~370.
 * `bucket` is the ISO prefix of the observation time ("2026-10-10T01" for an
 * hour, "2026-10-10" for a day), which sorts the same as time; `timestamp`
 * is the real observation that closes the bucket, so nothing is interpolated.
 */
export const HOURLY_TABLE = "observations_hourly";
export const DAILY_TABLE = "observations_daily";
export const HOUR_LENGTH = 13;
export const DAY_LENGTH = 10;

const rollupSchema = (table: string) =>
  `CREATE TABLE IF NOT EXISTS ${table} (currency TEXT NOT NULL, bucket TEXT NOT NULL, timestamp TEXT NOT NULL, price REAL NOT NULL, stale INTEGER NOT NULL, PRIMARY KEY(currency,bucket))`;
export const HOURLY_SCHEMA = rollupSchema(HOURLY_TABLE);
export const DAILY_SCHEMA = rollupSchema(DAILY_TABLE);

/** Keeps the latest observation of the bucket; an older late write cannot replace it. */
const rollupUpsert = (table: string) =>
  `INSERT INTO ${table} (currency, bucket, timestamp, price, stale) VALUES (?, ?, ?, ?, ?) ON CONFLICT(currency, bucket) DO UPDATE SET timestamp = excluded.timestamp, price = excluded.price, stale = excluded.stale WHERE excluded.timestamp > ${table}.timestamp`;
export const UPSERT_HOURLY = rollupUpsert(HOURLY_TABLE);
export const UPSERT_DAILY = rollupUpsert(DAILY_TABLE);

const rollupHistory = (table: string) =>
  `SELECT timestamp, price, stale FROM ${table} WHERE currency = ? AND bucket >= ? GROUP BY CAST(unixepoch(timestamp) * 1000 / ? AS INTEGER) HAVING timestamp = MAX(timestamp) ORDER BY timestamp`;
export const HOURLY_HISTORY_QUERY = rollupHistory(HOURLY_TABLE);
export const DAILY_HISTORY_QUERY = rollupHistory(DAILY_TABLE);

/** One-off fill of the rollups from observations stored before they existed. */
export const BACKFILL_HOURLY = `INSERT OR IGNORE INTO ${HOURLY_TABLE} SELECT currency, substr(timestamp, 1, ${HOUR_LENGTH}), timestamp, price, stale FROM observations WHERE currency = ? GROUP BY substr(timestamp, 1, ${HOUR_LENGTH}) HAVING timestamp = MAX(timestamp)`;
export const BACKFILL_DAILY = `INSERT OR IGNORE INTO ${DAILY_TABLE} SELECT currency, substr(timestamp, 1, ${DAY_LENGTH}), timestamp, price, stale FROM ${HOURLY_TABLE} WHERE currency = ? GROUP BY substr(timestamp, 1, ${DAY_LENGTH}) HAVING timestamp = MAX(timestamp)`;

const rollupRetention = (table: string) =>
  `DELETE FROM ${table} WHERE currency IN (${fiatCodes.map(() => "?").join(", ")}) AND bucket < ?`;
export const HOURLY_RETENTION_DELETE = rollupRetention(HOURLY_TABLE);
export const DAILY_RETENTION_DELETE = rollupRetention(DAILY_TABLE);

