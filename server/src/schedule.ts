/**
 * When the market store refreshes from TGJU.
 *
 * It used to refresh every 45 seconds, around the clock, whether or not anyone
 * was looking — ~1,900 refreshes and ~7,600 TGJU page loads a day, each paid
 * for in Durable Object requests and rows written. Now it refreshes every 45
 * seconds only while someone is using the app, and every 10 minutes otherwise,
 * which keeps a coarse history without the idle cost. The first request after
 * a quiet spell still refreshes immediately (its data is older than 45 s), so a
 * user never waits 10 minutes for a fresh price.
 */
export const ACTIVE_INTERVAL_MS = 45_000;
export const IDLE_INTERVAL_MS = 10 * 60_000;
/**
 * The 20 extra currencies refresh at most this often. Kept under the clients'
 * five-minute retrieval-freshness window, so their alerts can still fire.
 */
export const EXTRAS_INTERVAL_MS = 4 * 60_000;
/** A client request within this window counts as "someone is using the app". */
export const ACTIVE_WINDOW_MS = 10 * 60_000;
export const BASE_BACKOFF_MS = 15_000;
export const MAX_BACKOFF_MS = 300_000;

/** Minimum age of the last attempt before a request may trigger another. */
export function cooldownMs(failures: number): number {
  return failures > 0
    ? Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** Math.min(failures - 1, 5))
    : ACTIVE_INTERVAL_MS;
}

/** Delay until the next scheduled refresh, after one has just finished. */
export function nextRefreshDelayMs(
  now: number,
  lastClientAt: number | null,
  failures: number,
): number {
  if (failures > 0) return cooldownMs(failures);
  return lastClientAt !== null && now - lastClientAt < ACTIVE_WINDOW_MS
    ? ACTIVE_INTERVAL_MS
    : IDLE_INTERVAL_MS;
}

/**
 * Returns the alarm time to write, or null to leave the existing alarm alone.
 * Rewriting an alarm costs a row written, so a request only moves the alarm
 * earlier (a visitor during idle cadence) and never rewrites an equal or
 * earlier one — the old code rewrote it on every single request.
 */
export function alarmToWrite(
  existing: number | null,
  desired: number,
): number | null {
  return existing === null || existing > desired ? desired : null;
}
