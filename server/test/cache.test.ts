import { it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  fiatCodes,
  type MarketSnapshot,
  type MarketDataProvider,
} from "@arzman/shared";
import { parseTgju } from "../src/providers/tgju";
import { refreshSnapshot, type SnapshotCache } from "../src/cache";
const valid: MarketSnapshot = {
  schemaVersion: 1,
  quotes: fiatCodes.map((c) =>
    parseTgju(
      readFileSync(`server/test/fixtures/${c.toLowerCase()}.html`, "utf8"),
      c,
    ),
  ),
  fetchedAt: new Date().toISOString(),
  status: "stale",
};
it("retains last-known-good after upstream failure without rewriting its age", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const write = vi.fn();
  const cache: SnapshotCache = { read: async () => valid, write };
  const provider: MarketDataProvider = {
    name: "broken",
    fetchSnapshot: async () => {
      throw new Error("Changed source");
    },
  };
  const result = await refreshSnapshot(provider, cache);
  expect(write).not.toHaveBeenCalled();
  expect(result.snapshot?.fetchedAt).toBe(valid.fetchedAt);
  expect(result.snapshot?.quotes.every((q) => q.stale)).toBe(true);
  expect(result.failed).toBe(true);
  log.mockRestore();
});
it("validates external snapshots before replacing a cache", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const write = vi.fn();
  const malformed = {
    ...valid,
    quotes: valid.quotes.map((q) => ({ ...q, priceToman: 0 })),
  };
  const result = await refreshSnapshot(
    { name: "malformed", fetchSnapshot: async () => malformed },
    { read: async () => undefined, write },
  );
  expect(result.snapshot).toBeNull();
  expect(write).not.toHaveBeenCalled();
  log.mockRestore();
});
it("persists only the complete valid snapshot", async () => {
  const write = vi.fn();
  const result = await refreshSnapshot(
    { name: "valid", fetchSnapshot: async () => valid },
    { read: async () => undefined, write },
  );
  expect(write).toHaveBeenCalledOnce();
  expect(result.failed).toBe(false);
});
