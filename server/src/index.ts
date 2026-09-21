import { DurableObject } from "cloudflare:workers";
import {
  CurrencySchema,
  type MarketSnapshot,
  type HistoricalPoint,
} from "@arzman/shared";
import { TGJUProvider } from "./providers/tgju";
import { refreshSnapshot, staleSnapshot } from "./cache";

interface Env {
  MARKET: DurableObjectNamespace<MarketStore>;
  ALLOWED_ORIGIN: string;
}
const REFRESH = 300_000;
const ranges: Record<string, number> = {
  "1H": 3600_000,
  "1D": 86400_000,
  "1W": 7 * 86400_000,
  "1M": 30 * 86400_000,
  "3M": 90 * 86400_000,
  "1Y": 365 * 86400_000,
};
export class MarketStore extends DurableObject<Env> {
  private pending: Promise<void> | null = null;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS observations (currency TEXT NOT NULL, timestamp TEXT NOT NULL, price REAL NOT NULL, stale INTEGER NOT NULL, PRIMARY KEY(currency,timestamp))",
    );
  }
  async refresh() {
    if (this.pending) return this.pending;
    this.pending = this.update();
    try {
      await this.pending;
    } finally {
      this.pending = null;
    }
  }
  private async update() {
    const attempt = (await this.ctx.storage.get<number>("lastAttempt")) ?? 0;
    if (Date.now() - attempt < REFRESH) {
      await this.ctx.storage.setAlarm(attempt + REFRESH + 1000);
      return;
    }
    await this.ctx.storage.put("lastAttempt", Date.now());
    const result = await refreshSnapshot(new TGJUProvider(), {
      read: () => this.ctx.storage.get<MarketSnapshot>("snapshot"),
      write: (s) => this.ctx.storage.put("snapshot", s),
    });
    if (!result.failed && result.snapshot) {
      const snapshot = result.snapshot;
      await this.ctx.storage.delete("lastError");
      for (const q of snapshot.quotes)
        this.ctx.storage.sql.exec(
          "INSERT OR IGNORE INTO observations VALUES (?, ?, ?, ?)",
          q.currency,
          q.fetchedAt,
          q.priceToman,
          q.stale ? 1 : 0,
        );
      this.ctx.storage.sql.exec(
        "DELETE FROM observations WHERE timestamp < ?",
        new Date(Date.now() - ranges["1Y"]).toISOString(),
      );
    } else {
      await this.ctx.storage.put("lastError", true);
    }
    await this.ctx.storage.setAlarm(Date.now() + REFRESH);
  }
  async alarm() {
    await this.refresh();
  }
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/history/")) {
      const code = CurrencySchema.safeParse(url.pathname.split("/").pop());
      const range = url.searchParams.get("range") ?? "1D";
      if (!code.success || !ranges[range])
        return Response.json(
          { error: "Invalid currency or range" },
          { status: 400 },
        );
      // Select one real observation per bucket; never interpolate missing data.
      const bucket = Math.max(300_000, Math.ceil(ranges[range] / 240));
      const rows = this.ctx.storage.sql
        .exec<{ timestamp: string; price: number; stale: number }>(
          "SELECT timestamp, price, stale FROM observations WHERE currency = ? AND timestamp >= ? GROUP BY CAST(unixepoch(timestamp) * 1000 / ? AS INTEGER) HAVING timestamp = MAX(timestamp) ORDER BY timestamp",
          code.data,
          new Date(Date.now() - ranges[range]).toISOString(),
          bucket,
        )
        .toArray();
      const points: HistoricalPoint[] = rows.map((r) => ({
        timestamp: r.timestamp,
        priceToman: r.price,
        source: "TGJU",
        stale: !!r.stale,
      }));
      return Response.json({
        currency: code.data,
        range,
        points,
        kind: "observations",
      });
    }
    const code =
      url.pathname === "/api/market"
        ? null
        : CurrencySchema.safeParse(url.pathname.split("/").pop());
    if (
      url.pathname !== "/api/market" &&
      (!url.pathname.startsWith("/api/market/") || !code?.success)
    )
      return Response.json({ error: "Not found" }, { status: 404 });
    await this.refresh();
    const saved = await this.ctx.storage.get<MarketSnapshot>("snapshot");
    if (!saved)
      return Response.json(
        {
          error: "SOURCE_UNAVAILABLE",
          message: "منبع نرخ در دسترس نیست؛ دوباره تلاش کنید",
        },
        { status: 503, headers: { "Retry-After": "300" } },
      );
    const failed = await this.ctx.storage.get<boolean>("lastError");
    const snapshot =
      failed || Date.now() - Date.parse(saved.fetchedAt) > REFRESH
        ? staleSnapshot(saved)
        : saved;
    return Response.json(
      code?.success
        ? snapshot.quotes.find((q) => q.currency === code.data)
        : snapshot,
    );
  }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    };
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "GET")
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers },
      );
    if (new URL(request.url).pathname === "/health")
      return Response.json({ service: "ArzMan", ok: true }, { headers });
    try {
      const response = await env.MARKET.get(
        env.MARKET.idFromName("global"),
      ).fetch(request);
      const result = new Response(response.body, response);
      for (const [key, value] of Object.entries(headers))
        result.headers.set(key, value);
      return result;
    } catch (error) {
      console.error(
        "worker_error",
        error instanceof Error ? error.message : "Unknown",
      );
      return Response.json(
        { error: "SERVICE_UNAVAILABLE" },
        { status: 503, headers },
      );
    }
  },
};
