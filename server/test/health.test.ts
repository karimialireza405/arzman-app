import { describe, expect, it, vi } from "vitest";
import {
  ALERT_REPEAT_MS,
  decideAlert,
  lastGoodAt,
  sendAlert,
  staleAfterMs,
} from "../src/health";

const MIN = 60_000;
const base = { now: 10_000 * MIN, staleAfterMs: 30 * MIN };

describe("stale-data alert decisions", () => {
  it("stays quiet while data is fresh", () => {
    expect(decideAlert({ ...base, lastGoodAt: base.now - 5 * MIN, alertedAt: null })).toBe("none");
  });
  it("alerts once when data passes the threshold", () => {
    const lastGood = base.now - 31 * MIN;
    expect(decideAlert({ ...base, lastGoodAt: lastGood, alertedAt: null })).toBe("alert");
    expect(decideAlert({ ...base, lastGoodAt: lastGood, alertedAt: base.now - MIN })).toBe("none");
  });
  it("repeats only after the repeat interval", () => {
    const lastGood = base.now - 600 * MIN;
    expect(
      decideAlert({ ...base, lastGoodAt: lastGood, alertedAt: base.now - ALERT_REPEAT_MS }),
    ).toBe("repeat");
  });
  it("announces recovery only if an alert was open", () => {
    expect(decideAlert({ ...base, lastGoodAt: base.now - MIN, alertedAt: base.now - 90 * MIN })).toBe("recover");
  });
  it("treats never having had data as stale", () => {
    expect(decideAlert({ ...base, lastGoodAt: null, alertedAt: null })).toBe("alert");
  });
});

it("uses the freshest source and a sane threshold", () => {
  const a = "2026-10-10T00:00:00.000Z";
  const b = "2026-10-10T00:10:00.000Z";
  expect(lastGoodAt(a, undefined, b)).toBe(Date.parse(b));
  expect(lastGoodAt(undefined, undefined)).toBeNull();
  expect(staleAfterMs(undefined)).toBe(30 * MIN);
  expect(staleAfterMs("1")).toBe(30 * MIN);
  expect(staleAfterMs("45")).toBe(45 * MIN);
});

describe("sendAlert", () => {
  it("refuses non-https URLs and never throws", async () => {
    const fetcher = vi.fn();
    expect(await sendAlert("http://ntfy.sh/x", "t", fetcher)).toBe(false);
    expect(await sendAlert(undefined, "t", fetcher)).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = vi.fn().mockRejectedValue(new Error("down"));
    expect(await sendAlert("https://ntfy.sh/x", "t", boom)).toBe(false);
    log.mockRestore();
  });
  it("posts the text as the body", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("ok"));
    expect(await sendAlert("https://ntfy.sh/x", "hello", fetcher)).toBe(true);
    expect(fetcher.mock.calls[0][1].body).toBe("hello");
  });
});
