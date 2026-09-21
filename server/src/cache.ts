import {
  MarketSnapshotSchema,
  type MarketSnapshot,
  type MarketDataProvider,
} from "@arzman/shared";
export function staleSnapshot(snapshot: MarketSnapshot): MarketSnapshot {
  return {
    ...snapshot,
    status: "stale",
    message: "دادهٔ ذخیره‌شده؛ تازگی نرخ تأیید نشده است",
    quotes: snapshot.quotes.map((q) => ({ ...q, stale: true })),
  };
}
export interface SnapshotCache {
  read(): Promise<MarketSnapshot | undefined>;
  write(snapshot: MarketSnapshot): Promise<void>;
}
/** Validate the entire replacement before writing. Failures never overwrite last-known-good storage. */
export async function refreshSnapshot(
  provider: MarketDataProvider,
  cache: SnapshotCache,
): Promise<{ snapshot: MarketSnapshot | null; failed: boolean }> {
  try {
    const snapshot = MarketSnapshotSchema.parse(await provider.fetchSnapshot());
    await cache.write(snapshot);
    return { snapshot, failed: false };
  } catch (error) {
    console.error("market_refresh_failed", {
      message:
        error instanceof Error ? error.message : "Unknown provider error",
    });
    const previous = await cache.read();
    return {
      snapshot: previous ? staleSnapshot(previous) : null,
      failed: true,
    };
  }
}
