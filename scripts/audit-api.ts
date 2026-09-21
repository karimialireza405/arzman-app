/** Read-only API smoke test. Usage: npx tsx scripts/audit-api.ts [base URL] */
import assert from "node:assert/strict";
import { CurrencyQuoteSchema, HistorySchema, MarketSnapshotSchema, fiatCodes } from "../packages/shared/src";

async function main() {
  const base = (process.argv[2] ?? "http://127.0.0.1:8787").replace(/\/$/, "");
  for (const [path, method, expected] of [
    ["/health", "GET", 200], ["/api/market", "GET", 200],
    ...fiatCodes.map((code) => [`/api/market/${code}`, "GET", 200] as const),
    ["/api/history/USD?range=1D", "GET", 200],
    ["/api/market/XXX", "GET", 404],
    ["/api/history/XXX?range=1D", "GET", 400],
    ["/api/history/USD?range=bad", "GET", 400],
    ["/api/history/USD?range=toString", "GET", 400],
    ["/api/history/USD?range=__proto__", "GET", 400],
    ["/api/market", "POST", 405], ["/api/market", "OPTIONS", 204],
  ] as const) {
    const response = await fetch(base + path, { method, headers: { Origin: "http://localhost:8081" }, signal: AbortSignal.timeout(60000) });
    assert.equal(response.status, expected, `${method} ${path}`);
    assert.ok(response.headers.get("access-control-allow-origin"), "Missing CORS");
    const body = response.status === 204 ? null : await response.json();
    if (method === "GET" && response.ok) {
      if (path === "/api/market") {
        const snapshot = MarketSnapshotSchema.parse(body);
        console.log(JSON.stringify({ base, fetchedAt: snapshot.fetchedAt, status: snapshot.status, quotes: snapshot.quotes.map(({ currency, rawValue, rawUnit, quoteSize, priceToman, stale, sourceTimestamp }) => ({ currency, rawValue, rawUnit, quoteSize, priceToman, stale, sourceTimestamp })) }));
      } else if (path.startsWith("/api/market/")) CurrencyQuoteSchema.parse(body);
      else if (path.startsWith("/api/history/")) {
        const history = HistorySchema.parse(body);
        assert.ok(history.points.length <= 241);
        console.log(JSON.stringify({ historyPoints: history.points.length, first: history.points[0]?.timestamp, last: history.points.at(-1)?.timestamp }));
      } else assert.equal(body.ok, true);
    }
    console.log(`${method} ${path}: ${response.status} PASS`);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
