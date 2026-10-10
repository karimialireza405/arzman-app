import { DurableObject } from "cloudflare:workers";
import {
  CurrencySchema,
  fiatCodes,
  type CurrencyQuote,
  type MarketSnapshot,
  type HistoricalPoint,
} from "@arzman/shared";
import { TGJUProvider } from "./providers/tgju";
import { fetchOverviewHtml, parseOverview } from "./providers/tgju/overview";
import { BrsApiProvider } from "./providers/brsapi";
import { refreshSnapshot, staleSnapshot } from "./cache";
import {
  FALLBACK_MAX_AGE_MS,
  alertText,
  decideAlert,
  lastGoodAt,
  sendAlert,
  staleAfterMs,
} from "./health";
import {
  BACKFILL_DAILY,
  BACKFILL_HOURLY,
  DAILY_RETENTION_DELETE,
  DAILY_SCHEMA,
  DAY_LENGTH,
  HOURLY_RETENTION_DELETE,
  HOURLY_SCHEMA,
  HOUR_LENGTH,
  INSERT_OBSERVATION,
  OBSERVATIONS_SCHEMA,
  RETENTION_DELETE,
  UPSERT_DAILY,
  UPSERT_HOURLY,
  retentionParams,
} from "./sql";
import {
  DAILY_RETENTION_MS,
  HISTORY_TTL_MS,
  HOURLY_RETENTION_MS,
  RANGE_MS,
  RAW_RETENTION_MS,
  TtlCache,
  planHistory,
} from "./history";
import {
  ACTIVE_INTERVAL_MS,
  EXTRAS_INTERVAL_MS,
  alarmToWrite,
  cooldownMs,
  nextRefreshDelayMs,
} from "./schedule";

interface Env {
  MARKET: DurableObjectNamespace<MarketStore>;
  ALLOWED_ORIGIN: string;
  /** Secret. Enables the BRSAPI fallback; without it TGJU is the only source. */
  BRSAPI_KEY?: string;
  /** Secret. https URL of a private ntfy topic (or compatible) for stale-data alerts. */
  ALERT_WEBHOOK_URL?: string;
  /** Minutes without fresh data before alerting (default 30, minimum 5). */
  STALE_ALERT_MINUTES?: string;
}
export class MarketStore extends DurableObject<Env> {
  private pending: Promise<void> | null = null;
  /**
   * When a client last asked for data. Deliberately in memory, not storage:
   * persisting it would cost a row written per request, and losing it on
   * eviction is harmless — the store simply falls back to the idle cadence
   * until the next request, which refreshes immediately anyway.
   */
  private lastClientAt: number | null = null;
  /** In memory for the same reason; after an eviction the extras simply refresh. */
  private lastExtrasAttempt = 0;
  /**
   * Computed history responses. In memory: losing them on eviction only costs
   * one recomputation, while persisting them would cost rows written.
   */
  private historyCache = new TtlCache<HistoricalPoint[]>();
  private lastRetentionAt = 0;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(OBSERVATIONS_SCHEMA);
    ctx.storage.sql.exec(HOURLY_SCHEMA);
    ctx.storage.sql.exec(DAILY_SCHEMA);
    // Observations stored before the rollups existed are folded in once, a
    // currency at a time through the primary key, before anything expires.
    void ctx.blockConcurrencyWhile(async () => {
      if (await ctx.storage.get<boolean>("rollupsBackfilled")) return;
      for (const currency of fiatCodes) {
        ctx.storage.sql.exec(BACKFILL_HOURLY, currency);
        ctx.storage.sql.exec(BACKFILL_DAILY, currency);
      }
      await ctx.storage.put("rollupsBackfilled", true);
    });
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
      this.record(snapshot.quotes);
      await this.refreshExtras(snapshot);
      this.expire();
      const now = Date.now();
      await this.ctx.storage.setAlarm(
        now + nextRefreshDelayMs(now, this.lastClientAt, 0),
      );
    } else {
      await this.refreshFallback();
      const nextFailures = failures + 1;
      await this.ctx.storage.put("consecutiveFailures", nextFailures);
      await this.ctx.storage.put("lastError", true);
      await this.ctx.storage.setAlarm(Date.now() + cooldownMs(nextFailures));
    }
  }
  /** TGJU just failed: try the second source, if the owner configured one. */
  private async refreshFallback() {
    const key = this.env.BRSAPI_KEY;
    if (!key) return;
    const provider = new BrsApiProvider(key, () =>
      this.ctx.storage.get<MarketSnapshot>("snapshot"),
    );
    await refreshSnapshot(provider, {
      read: () => this.ctx.storage.get<MarketSnapshot>("fallback"),
      write: (snapshot) => this.ctx.storage.put("fallback", snapshot),
    });
  }
  /** Called by the cron trigger: keep the refresh loop alive and alert once if data is stale. */
  async checkHealth() {
    await this.refresh();
    const now = Date.now();
    const good = await this.freshness(now);
    const alertedAt = (await this.ctx.storage.get<number>("alertedAt")) ?? null;
    const action = decideAlert({
      now,
      lastGoodAt: good.at,
      alertedAt,
      staleAfterMs: staleAfterMs(this.env.STALE_ALERT_MINUTES),
    });
    if (action === "none") return;
    const sent = await sendAlert(
      this.env.ALERT_WEBHOOK_URL,
      alertText(action, now, good.at),
    );
    // An unsent alert stays open so the next check retries it.
    if (!sent) return;
    if (action === "recover") await this.ctx.storage.delete("alertedAt");
    else await this.ctx.storage.put("alertedAt", now);
  }
  private async freshness(now: number) {
    const primary = await this.ctx.storage.get<MarketSnapshot>("snapshot");
    const fallback = await this.ctx.storage.get<MarketSnapshot>("fallback");
    return {
      at: lastGoodAt(primary?.fetchedAt, fallback?.fetchedAt),
      primaryAgeS: primary ? Math.round((now - Date.parse(primary.fetchedAt)) / 1000) : null,
      fallbackAgeS: fallback ? Math.round((now - Date.parse(fallback.fetchedAt)) / 1000) : null,
    };
  }
  private record(quotes: CurrencyQuote[]) {
    const sql = this.ctx.storage.sql;
    for (const q of quotes) {
      const stale = q.stale ? 1 : 0;
      sql.exec(INSERT_OBSERVATION, q.currency, q.fetchedAt, q.priceToman, stale);
      const iso = new Date(q.fetchedAt).toISOString();
      sql.exec(UPSERT_HOURLY, q.currency, iso.slice(0, HOUR_LENGTH), q.fetchedAt, q.priceToman, stale);
      sql.exec(UPSERT_DAILY, q.currency, iso.slice(0, DAY_LENGTH), q.fetchedAt, q.priceToman, stale);
    }
  }
  /** Drops expired rows, at most once an hour: nothing expires faster than that. */
  private expire() {
    const now = Date.now();
    if (now - this.lastRetentionAt < 3600_000) return;
    this.lastRetentionAt = now;
    const sql = this.ctx.storage.sql;
    const cutoff = (ms: number) => new Date(now - ms).toISOString();
    sql.exec(RETENTION_DELETE, ...retentionParams(cutoff(RAW_RETENTION_MS)));
    sql.exec(HOURLY_RETENTION_DELETE, ...retentionParams(cutoff(HOURLY_RETENTION_MS).slice(0, HOUR_LENGTH)));
    sql.exec(DAILY_RETENTION_DELETE, ...retentionParams(cutoff(DAILY_RETENTION_MS).slice(0, DAY_LENGTH)));
  }
  /**
   * The 20 extra currencies come from one overview page, on a slower cadence
   * than the core four (one ~250 KB read every few minutes). Their failure
   * never fails the core snapshot: the last good extras are kept and age out.
   */
  private async refreshExtras(core: MarketSnapshot) {
    if (Date.now() - this.lastExtrasAttempt < EXTRAS_INTERVAL_MS) return;
    this.lastExtrasAttempt = Date.now();
    const usd = core.quotes.find((q) => q.currency === "USD");
    if (!usd) return;
    try {
      const html = await fetchOverviewHtml((input, init) => fetch(input, init));
      const quotes = parseOverview(html, usd.priceToman, Date.now(), (currency, message) =>
        console.error("extra_quote_rejected", { currency, message }),
      );
      if (!quotes.length) throw new Error("No extra currency passed validation");
      await this.ctx.storage.put("extras", quotes);
      this.record(quotes);
    } catch (error) {
      console.error("extras_refresh_failed", {
        message: error instanceof Error ? error.message : "Unknown provider error",
      });
    }
  }
  async alarm() {
    await this.refresh();
  }
  async fetch(request: Request) {
    const url = new URL(request.url);
    // A monitor pinging this must not count as "someone is using the app".
    if (url.pathname === "/api/health") {
      const now = Date.now();
      const f = await this.freshness(now);
      const limit = staleAfterMs(this.env.STALE_ALERT_MINUTES);
      const ok = f.at !== null && now - f.at <= limit;
      return Response.json(
        {
          ok,
          lastGoodAt: f.at === null ? null : new Date(f.at).toISOString(),
          primaryAgeSeconds: f.primaryAgeS,
          fallbackConfigured: !!this.env.BRSAPI_KEY,
          fallbackAgeSeconds: f.fallbackAgeS,
          alertConfigured: !!this.env.ALERT_WEBHOOK_URL,
        },
        { status: ok ? 200 : 503 },
      );
    }
    this.lastClientAt = Date.now();
    if (url.pathname.startsWith("/api/history/")) {
      const code = CurrencySchema.safeParse(url.pathname.split("/").pop());
      const range = url.searchParams.get("range") ?? "1D";
      if (!code.success || !Object.hasOwn(RANGE_MS, range))
        return Response.json(
          { error: "Invalid currency or range" },
          { status: 400 },
        );
      const key = `${code.data}:${range}`;
      let points = this.historyCache.get(key);
      if (!points) {
        // Select one real observation per bucket; never interpolate missing data.
        const plan = planHistory(range, Date.now())!;
        const rows = this.ctx.storage.sql
          .exec<{ timestamp: string; price: number; stale: number }>(
            plan.sql,
            code.data,
            plan.cutoff,
            plan.bucketMs,
          )
          .toArray();
        points = rows.map((r) => ({
          timestamp: r.timestamp,
          priceToman: r.price,
          source: "TGJU",
          stale: !!r.stale,
        })) as HistoricalPoint[];
        this.historyCache.set(key, points, HISTORY_TTL_MS[range]);
      }
      return Response.json({
        currency: code.data,
        range,
        points,
        kind: "observations",
      });
    }
    // v1 (/api/market) is what app installs before the 24-currency release
    // read: exactly the four core quotes, which their schema requires.
    // v2 adds the extras.
    const all = url.pathname === "/api/v2/market";
    const code =
      url.pathname === "/api/market" || all
        ? null
        : CurrencySchema.safeParse(url.pathname.split("/").pop());
    if (
      url.pathname !== "/api/market" &&
      !all &&
      (!url.pathname.startsWith("/api/market/") || !code?.success)
    )
      return Response.json({ error: "Not found" }, { status: 404 });
    await this.refresh();
    const primary = await this.ctx.storage.get<MarketSnapshot>("snapshot");
    const failed = await this.ctx.storage.get<boolean>("lastError");
    const primaryFresh =
      !!primary &&
      !failed &&
      Date.now() - Date.parse(primary.fetchedAt) <= ACTIVE_INTERVAL_MS * 2;
    // v1 must stay TGJU-only: old installs parse `source` as the literal "TGJU".
    const fallback =
      !primaryFresh && (all || code?.success)
        ? await this.ctx.storage.get<MarketSnapshot>("fallback")
        : undefined;
    const useFallback =
      !!fallback && Date.now() - Date.parse(fallback.fetchedAt) <= FALLBACK_MAX_AGE_MS;
    const saved = useFallback ? fallback : primary;
    if (!saved)
      return Response.json(
        {
          error: "SOURCE_UNAVAILABLE",
          message: "منبع نرخ در دسترس نیست؛ دوباره تلاش کنید",
        },
        { status: 503, headers: { "Retry-After": "45" } },
      );
    const extras =
      all || code?.success
        ? ((await this.ctx.storage.get<CurrencyQuote[]>("extras")) ?? []).map((q) =>
            useFallback || Date.now() - Date.parse(q.fetchedAt) > EXTRAS_INTERVAL_MS * 2
              ? { ...q, stale: true }
              : q,
          )
        : [];
    const merged = {
      ...saved,
      ...(useFallback && {
        message: "TGJU در دسترس نیست؛ نرخ‌های اصلی موقتاً از منبع جایگزین (BRSAPI) است",
      }),
      quotes: [...saved.quotes, ...extras],
    };
    const snapshot =
      !useFallback &&
      (failed || Date.now() - Date.parse(saved.fetchedAt) > ACTIVE_INTERVAL_MS * 2)
        ? staleSnapshot(merged)
        : merged;
    if (code?.success) {
      const quote = snapshot.quotes.find((q) => q.currency === code.data);
      return quote
        ? Response.json(quote)
        : Response.json({ error: "Quote unavailable" }, { status: 404 });
    }
    return Response.json(snapshot);
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
  /** Cron trigger (wrangler.jsonc): data-freshness watchdog. */
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await env.MARKET.get(env.MARKET.idFromName("global")).checkHealth();
  },
};
