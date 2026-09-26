import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  HISTORY_QUERY,
  INSERT_OBSERVATION,
  OBSERVATIONS_SCHEMA,
  RETENTION_DELETE,
  retentionParams,
} from "../src/sql";

/**
 * Cloudflare bills a SQLite-backed Durable Object by rows read, scanned rows
 * included, and the Workers Free plan stops *all* storage once 5M are spent in
 * a day. A full-table scan in a statement that runs every refresh is therefore
 * an outage, not a slowdown — this is exactly what took the API down in
 * September 2026. These tests ask SQLite itself how it will run each statement.
 */
const fresh = () => {
  const db = new DatabaseSync(":memory:");
  db.exec(OBSERVATIONS_SCHEMA);
  return db;
};
const plan = (db: DatabaseSync, sql: string, params: (string | number)[]) =>
  db
    .prepare(`EXPLAIN QUERY PLAN ${sql}`)
    .all(...params)
    .map((row) => String((row as { detail: string }).detail))
    .join(" | ");

describe("observation SQL stays on the primary key", () => {
  it("never scans the table to enforce retention", () => {
    const detail = plan(fresh(), RETENTION_DELETE, retentionParams("2025-09-26T00:00:00.000Z"));
    expect(detail).not.toMatch(/SCAN observations/);
    expect(detail).toMatch(/SEARCH observations USING INDEX/);
  });

  it("the old retention statement did scan, which is what this guards against", () => {
    const detail = plan(fresh(), "DELETE FROM observations WHERE timestamp < ?", ["2025-09-26"]);
    expect(detail).toMatch(/SCAN observations/);
  });

  it("reads history through the index", () => {
    const detail = plan(fresh(), HISTORY_QUERY, ["USD", "2026-09-25T00:00:00.000Z", 360_000]);
    expect(detail).not.toMatch(/SCAN observations/);
    expect(detail).toMatch(/SEARCH observations USING INDEX/);
  });

  it("still deletes exactly the expired rows, for every currency", () => {
    const db = fresh();
    const insert = db.prepare(INSERT_OBSERVATION);
    for (const currency of ["USD", "EUR", "AED", "IQD"]) {
      insert.run(currency, "2025-01-01T00:00:00.000Z", 1, 0);
      insert.run(currency, "2026-09-26T00:00:00.000Z", 1, 0);
    }
    db.prepare(RETENTION_DELETE).run(...retentionParams("2025-09-26T00:00:00.000Z"));
    const left = db.prepare("SELECT currency, timestamp FROM observations ORDER BY currency").all();
    expect(left).toHaveLength(4);
    expect(left.every((r) => String((r as { timestamp: string }).timestamp).startsWith("2026"))).toBe(true);
  });
});
