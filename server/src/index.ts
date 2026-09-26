import { DurableObject } from "cloudflare:workers";
import {
  CurrencySchema,
  type MarketSnapshot,
  type HistoricalPoint,
} from "@arzman/shared";
import { TGJUProvider } from "./providers/tgju";
import { refreshSnapshot, staleSnapshot } from "./cache";
import {
  HISTORY_QUERY,
  INSERT_OBSERVATION,
  OBSERVATIONS_SCHEMA,
  RETENTION_DELETE,
  retentionParams,
} from "./sql";
import {
  ACTIVE_INTERVAL_MS,
  alarmToWrite,
  cooldownMs,
  nextRefreshDelayMs,
} from "./schedule";

interface Env {
  MARKET: DurableObjectNamespace<MarketStore>;
  ALLOWED_ORIGIN: string;
}
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
  /**
   * When a client last asked for data. Deliberately in memory, not storage:
   * persisting it would cost a row written per request, and losing it on
   * eviction is harmless — the store simply falls back to the idle cadence
   * until the next request, which refreshes immediately anyway.
   */
  private lastClientAt: number | null = null;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(OBSERVATIONS_SCHEMA);
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
    const failures = (await this.ctx.storage.get<number>("consecutiveFailures")) ?? 0;
    const cooldown = cooldownMs(failures);

    if (Date.now() - attempt < cooldown) {
      const next = alarmToWrite(
        await this.ctx.storage.getAlarm(),
        attempt + cooldown + 500,
      );
      if (next !== null) await this.ctx.storage.setAlarm(next);
      return;
    }
    await this.ctx.storage.put("lastAttempt", Date.now());
    const result = await refreshSnapshot(new TGJUProvider(), {
      read: () => this.ctx.storage.get<MarketSnapshot>("snapshot"),
      write: (s) => this.ctx.storage.put("snapshot", s),
    });
    if (!result.failed && result.snapshot) {
      const snapshot = result.snapshot;
      // Only a failure ever sets these, so only a recovery needs to clear them.
      if (failures > 0) {
        await this.ctx.storage.delete("lastError");
        await this.ctx.storage.put("consecutiveFailures", 0);
      }
      for (const q of snapshot.quotes)
        this.ctx.storage.sql.exec(
          INSERT_OBSERVATION,
          q.currency,
          q.fetchedAt,
          q.priceToman,
          q.stale ? 1 : 0,
        );
      this.ctx.storage.sql.exec(
        RETENTION_DELETE,
        ...retentionParams(new Date(Date.now() - ranges["1Y"]).toISOString()),
      );
      const now = Date.now();
      await this.ctx.storage.setAlarm(
        now + nextRefreshDelayMs(now, this.lastClientAt, 0),
      );
    } else {
      const nextFailures = failures + 1;
      await this.ctx.storage.put("consecutiveFailures", nextFailures);
      await this.ctx.storage.put("lastError", true);
      await this.ctx.storage.setAlarm(Date.now() + cooldownMs(nextFailures));
    }
  }
  async alarm() {
    await this.refresh();
  }
  async fetch(request: Request) {
    this.lastClientAt = Date.now();
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/history/")) {
      const code = CurrencySchema.safeParse(url.pathname.split("/").pop());
      const range = url.searchParams.get("range") ?? "1D";
      if (!code.success || !Object.hasOwn(ranges, range))
        return Response.json(
          { error: "Invalid currency or range" },
          { status: 400 },
        );
      // Select one real observation per bucket; never interpolate missing data.
      const bucket = Math.max(300_000, Math.ceil(ranges[range] / 240));
      const rows = this.ctx.storage.sql
        .exec<{ timestamp: string; price: number; stale: number }>(
          HISTORY_QUERY,
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
        { status: 503, headers: { "Retry-After": "45" } },
      );
    const failed = await this.ctx.storage.get<boolean>("lastError");
    const snapshot =
      failed || Date.now() - Date.parse(saved.fetchedAt) > ACTIVE_INTERVAL_MS * 2
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
