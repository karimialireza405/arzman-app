import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  BACKFILL_DAILY,
  BACKFILL_HOURLY,
  DAILY_SCHEMA,
  HOURLY_SCHEMA,
  INSERT_OBSERVATION,
  OBSERVATIONS_SCHEMA,
  UPSERT_DAILY,
  UPSERT_HOURLY,
} from "../src/sql";
import {
  RANGE_MS,
  TtlCache,
  dayBucket,
  hourBucket,
  planHistory,
} from "../src/history";

const NOW = Date.parse("2026-10-10T12:00:00.000Z");
const STEP = 45_000;
const ROLLUP_TABLES = {
  hourly: "observations_hourly",
  daily: "observations_daily",
};

const fresh = () => {
  const db = new DatabaseSync(":memory:");
  db.exec(OBSERVATIONS_SCHEMA);
  db.exec(HOURLY_SCHEMA);
  db.exec(DAILY_SCHEMA);
  return db;
};
/** A year of 45-second observations for one currency, the worst case the API sees. */
const seedYear = (db: DatabaseSync, currency = "USD") => {
  const first = NOW - RANGE_MS["1Y"];
  db.exec("BEGIN");
  const insert = db.prepare(INSERT_OBSERVATION);
  for (let t = first; t <= NOW; t += STEP) {
    insert.run(
      currency,
      new Date(t).toISOString(),
      1000 + ((t / STEP) % 500),
      0,
    );
  }
  db.exec("COMMIT");
};
const backfill = (db: DatabaseSync, currency = "USD") => {
  db.prepare(BACKFILL_HOURLY).run(currency);
  db.prepare(BACKFILL_DAILY).run(currency);
};
const run = (db: DatabaseSync, range: string) => {
  const plan = planHistory(range, NOW)!;
  return db.prepare(plan.sql).all("USD", plan.cutoff, plan.bucketMs) as {
    timestamp: string;
    price: number;
  }[];
};

describe("history rollups", () => {
  it("chooses the cheapest table that can answer each range", () => {
    expect(planHistory("1H", NOW)!.sql).toMatch(/FROM observations WHERE/);
    expect(planHistory("1D", NOW)!.sql).toMatch(/FROM observations WHERE/);
    for (const range of ["1W", "1M", "3M"])
      expect(planHistory(range, NOW)!.sql).toMatch(/FROM observations_hourly/);
    expect(planHistory("1Y", NOW)!.sql).toMatch(/FROM observations_daily/);
    expect(planHistory("5Y", NOW)).toBeNull();
  });

  it("reads rollups through the primary key", () => {
    const db = fresh();
    for (const range of ["1W", "3M", "1Y"]) {
      const plan = planHistory(range, NOW)!;
      const detail = db
        .prepare(`EXPLAIN QUERY PLAN ${plan.sql}`)
        .all("USD", plan.cutoff, plan.bucketMs)
        .map((row) => String((row as { detail: string }).detail))
        .join(" | ");
      expect(detail).not.toMatch(/SCAN observations/);
      expect(detail).toMatch(/SEARCH observations_\w+ USING (COVERING )?INDEX/);
    }
  });

  it("scans few rows for long ranges on a full year of data", () => {
    const db = fresh();
    seedYear(db);
    backfill(db);
    const scanned = (range: string) => {
      const { sql, cutoff } = (() => {
        const plan = planHistory(range, NOW)!;
        const table = plan.sql.match(/FROM (\w+)/)![1];
        return {
          sql: `SELECT COUNT(*) AS n FROM ${table} WHERE currency = ? AND ${table === "observations" ? "timestamp" : "bucket"} >= ?`,
          cutoff: plan.cutoff,
        };
      })();
      return (db.prepare(sql).get("USD", cutoff) as { n: number }).n;
    };
    // The raw table would have read 700k rows for 1Y and 175k for 3M.
    expect(scanned("1Y")).toBeLessThanOrEqual(370);
    expect(scanned("3M")).toBeLessThanOrEqual(2200);
    expect(scanned("1M")).toBeLessThanOrEqual(730);
    expect(scanned("1W")).toBeLessThanOrEqual(170);
    expect(scanned("1D")).toBeLessThanOrEqual(1950);
    for (const range of Object.keys(RANGE_MS))
      expect(run(db, range).length).toBeLessThanOrEqual(366);
  }, 60_000);

  it("returns real, ordered observations and never invents a point", () => {
    const db = fresh();
    seedYear(db);
    backfill(db);
    const real = new Set(
      (
        db.prepare("SELECT timestamp FROM observations").all() as {
          timestamp: string;
        }[]
      ).map((r) => r.timestamp),
    );
    for (const range of ["1W", "3M", "1Y"]) {
      const rows = run(db, range);
      expect(rows.length).toBeGreaterThan(50);
      expect(rows.every((r) => real.has(r.timestamp))).toBe(true);
      const times = rows.map((r) => r.timestamp);
      expect([...times].sort()).toEqual(times);
    }
  }, 60_000);

  it("live upserts keep the latest observation of each hour and day, in any arrival order", () => {
    const db = fresh();
    const upsert = (iso: string, price: number) => {
      db.prepare(UPSERT_HOURLY).run("USD", hourBucket(iso), iso, price, 0);
      db.prepare(UPSERT_DAILY).run("USD", dayBucket(iso), iso, price, 0);
    };
    upsert("2026-10-10T01:10:00.000Z", 1);
    upsert("2026-10-10T01:50:00.000Z", 3);
    upsert("2026-10-10T01:30:00.000Z", 2); // late and older: must not win
    upsert("2026-10-10T02:05:00.000Z", 4);
    const hourly = db
      .prepare("SELECT bucket, price FROM observations_hourly ORDER BY bucket")
      .all();
    expect(hourly).toEqual([
      { bucket: "2026-10-10T01", price: 3 },
      { bucket: "2026-10-10T02", price: 4 },
    ]);
    expect(
      db.prepare("SELECT bucket, price FROM observations_daily").all(),
    ).toEqual([{ bucket: "2026-10-10", price: 4 }]);
  });

  it("the backfill agrees with what live upserts would have stored", () => {
    const live = fresh();
    const filled = fresh();
    const first = NOW - 5 * 86400_000;
    for (let t = first; t <= NOW; t += 10 * 60_000) {
      const iso = new Date(t).toISOString();
      const price = 1000 + ((t / 60_000) % 97);
      for (const db of [live, filled])
        db.prepare(INSERT_OBSERVATION).run("USD", iso, price, 0);
      live.prepare(UPSERT_HOURLY).run("USD", hourBucket(iso), iso, price, 0);
      live.prepare(UPSERT_DAILY).run("USD", dayBucket(iso), iso, price, 0);
    }
    backfill(filled);
    for (const table of Object.values(ROLLUP_TABLES))
      expect(
        filled.prepare(`SELECT * FROM ${table} ORDER BY bucket`).all(),
      ).toEqual(live.prepare(`SELECT * FROM ${table} ORDER BY bucket`).all());
  });
});

describe("TtlCache", () => {
  it("serves a value until its TTL ends, then forgets it", () => {
    let now = 0;
    const cache = new TtlCache<number>(() => now);
    cache.set("a", 1, 1000);
    now = 999;
    expect(cache.get("a")).toBe(1);
    now = 1000;
    expect(cache.get("a")).toBeUndefined();
  });

  it("stays bounded", () => {
    const cache = new TtlCache<number>(() => 0, 2);
    cache.set("a", 1, 10);
    cache.set("b", 2, 10);
    cache.set("c", 3, 10);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });
});
