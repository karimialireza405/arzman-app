/**
 * Shared, cached access to the server's observation history.
 *
 * Several surfaces want the same series (every home row draws a sparkline), so
 * requests are de-duplicated and cached for a few minutes. That matters beyond
 * speed: each history request is a Durable Object query billed in rows read,
 * and the free plan's daily budget is exactly what took the API down before.
 */
import { useEffect, useState } from "react";
import {
  HistorySchema,
  type Currency,
  type HistoricalPoint,
} from "@arzman/shared";
import { apiUrl } from "./store";

export type HistoryRange = "1H" | "1D" | "1W" | "1M" | "3M" | "1Y";

// A long range barely moves in minutes, and the server only recomputes it hourly.
const TTL_MS: Record<HistoryRange, number> = {
  "1H": 60_000,
  "1D": 5 * 60_000,
  "1W": 10 * 60_000,
  "1M": 15 * 60_000,
  "3M": 30 * 60_000,
  "1Y": 30 * 60_000,
};
const cache = new Map<string, { at: number; points: HistoricalPoint[] }>();
const inFlight = new Map<string, Promise<HistoricalPoint[] | null>>();

async function load(
  currency: Currency,
  range: HistoryRange,
): Promise<HistoricalPoint[] | null> {
  const key = `${currency}:${range}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS[range]) return hit.points;
  const pending = inFlight.get(key);
  if (pending) return pending;
  if (!apiUrl) return null;

  const request = (async () => {
    try {
      const response = await fetch(
        `${apiUrl}/api/history/${currency}?range=${range}`,
        {
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!response.ok) return null;
      const { points } = HistorySchema.parse(await response.json());
      cache.set(key, { at: Date.now(), points });
      return points;
    } catch {
      // No history is a normal state (new server, offline): callers draw nothing.
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, request);
  return request;
}

export interface HistoryResult {
  /** The series for exactly this currency and range, or null while unknown. */
  points: HistoricalPoint[] | null;
  loading: boolean;
  /** True once a request has finished without a usable series. */
  failed: boolean;
}

/** Like useHistory, but also reports progress so a chart can show its own state. */
export function useHistoryResult(
  currency: Currency,
  range: HistoryRange = "1D",
  enabled = true,
): HistoryResult {
  const key = `${currency}:${range}`;
  // Tagged with its key so a late or stale result never shows under another range.
  const [state, setState] = useState<{
    key: string;
    points: HistoricalPoint[] | null;
    done: boolean;
  }>(() => ({
    key,
    points: cache.get(key)?.points ?? null,
    done: cache.has(key),
  }));
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    const hit = cache.get(key);
    setState({ key, points: hit?.points ?? null, done: !!hit });
    void load(currency, range).then((result) => {
      if (current) setState({ key, points: result, done: true });
    });
    return () => {
      current = false;
    };
  }, [currency, range, enabled, key]);
  const fresh = state.key === key;
  const points = fresh ? state.points : (cache.get(key)?.points ?? null);
  const done = fresh && state.done;
  return { points, loading: enabled && !done, failed: done && points === null };
}

/** Observation series for a currency, or null while unknown/unavailable. */
export function useHistory(
  currency: Currency,
  range: HistoryRange = "1D",
  enabled = true,
) {
  return useHistoryResult(currency, range, enabled).points;
}
