/**
 * Pure rules for "has the market data gone stale?", kept apart from the
 * Durable Object so they can be tested without a runtime.
 */
export const DEFAULT_STALE_ALERT_MS = 30 * 60_000;
/** While still stale, remind at most this often. */
export const ALERT_REPEAT_MS = 6 * 3600_000;
/** A fallback snapshot older than this is not served as current. */
export const FALLBACK_MAX_AGE_MS = 10 * 60_000;

export type AlertAction = "alert" | "repeat" | "recover" | "none";

export function staleAfterMs(minutes: string | undefined): number {
  const n = Number(minutes);
  return Number.isFinite(n) && n >= 5 ? n * 60_000 : DEFAULT_STALE_ALERT_MS;
}

/** The newest successful fetch from any source, or null if there never was one. */
export function lastGoodAt(...fetchedAt: (string | undefined)[]): number | null {
  const times = fetchedAt
    .map((s) => (s ? Date.parse(s) : NaN))
    .filter(Number.isFinite);
  return times.length ? Math.max(...times) : null;
}

export function decideAlert(input: {
  now: number;
  lastGoodAt: number | null;
  /** When we last told the owner it was stale; null when no alert is open. */
  alertedAt: number | null;
  staleAfterMs: number;
}): AlertAction {
  const stale =
    input.lastGoodAt === null || input.now - input.lastGoodAt > input.staleAfterMs;
  if (!stale) return input.alertedAt === null ? "none" : "recover";
  if (input.alertedAt === null) return "alert";
  return input.now - input.alertedAt >= ALERT_REPEAT_MS ? "repeat" : "none";
}

export function alertText(
  action: Exclude<AlertAction, "none">,
  now: number,
  lastGood: number | null,
): string {
  if (action === "recover") return "ارز من: داده دوباره تازه شد ✅";
  const age =
    lastGood === null
      ? "هیچ داده‌ای"
      : `${Math.round((now - lastGood) / 60_000)} دقیقه است داده‌ی تازه‌ای`;
  return `ارز من ⚠️ ${age} از هیچ منبعی (TGJU یا جایگزین) نگرفته‌ام. سرور را چک کن.`;
}

/**
 * ntfy-style notification: plain-text POST to the owner's private topic URL.
 * Never throws — an alert channel failing must not break the market refresh.
 */
export async function sendAlert(
  url: string | undefined,
  text: string,
  fetcher: typeof fetch = (input, init) => fetch(input, init),
): Promise<boolean> {
  if (!url?.startsWith("https://")) return false;
  try {
    const res = await fetcher(url, {
      method: "POST",
      body: text,
      headers: { Title: "ArzMan", Priority: "high" },
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok;
  } catch {
    console.error("alert_send_failed");
    return false;
  }
}
