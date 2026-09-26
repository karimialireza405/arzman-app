/**
 * Shared, cached access to the server's observation history.
 *
 * Several surfaces want the same series (every home row draws a sparkline), so
 * requests are de-duplicated and cached for a few minutes. That matters beyond
 * speed: each history request is a Durable Object query billed in rows read,
 * and the free plan's daily budget is exactly what took the API down before.
 */
import { useEffect, useState } from "react";
import { HistorySchema, type Currency, type HistoricalPoint } from "@arzman/shared";
import { apiUrl } from "./store";

export type HistoryRange = "1H" | "1D" | "1W" | "1M" | "3M" | "1Y";

const TTL_MS = 5 * 60_000;
const cache = new Map<string, { at: number; points: HistoricalPoint[] }>();
const inFlight = new Map<string, Promise<HistoricalPoint[] | null>>();

async function load(currency: Currency, range: HistoryRange): Promise<HistoricalPoint[] | null> {
  const key = `${currency}:${range}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.points;
  const pending = inFlight.get(key);
  if (pending) return pending;
  if (!apiUrl) return null;

  const request = (async () => {
    try {
      const response = await fetch(`${apiUrl}/api/history/${currency}?range=${range}`, {
        signal: AbortSignal.timeout(20_000),
      });
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

/** Observation series for a currency, or null while unknown/unavailable. */
export function useHistory(currency: Currency, range: HistoryRange = "1D", enabled = true) {
  const [points, setPoints] = useState<HistoricalPoint[] | null>(
    () => cache.get(`${currency}:${range}`)?.points ?? null,
  );
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    void load(currency, range).then((result) => {
      if (current && result) setPoints(result);
    });
    return () => {
      current = false;
    };
  }, [currency, range, enabled]);
  return points;
}
