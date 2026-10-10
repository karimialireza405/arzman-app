import { describe, expect, it } from "vitest";
import {
  ACTIVE_INTERVAL_MS,
  ACTIVE_WINDOW_MS,
  IDLE_INTERVAL_MS,
  alarmToWrite,
  cooldownMs,
  nextRefreshDelayMs,
} from "../src/schedule";

const now = Date.parse("2026-09-27T12:00:00.000Z");

describe("refresh cadence", () => {
  it("refreshes every 45 s while someone is using the app", () => {
    expect(nextRefreshDelayMs(now, now - 5_000, 0)).toBe(ACTIVE_INTERVAL_MS);
    expect(nextRefreshDelayMs(now, now - ACTIVE_WINDOW_MS + 1, 0)).toBe(
      ACTIVE_INTERVAL_MS,
    );
  });

  it("falls back to every 10 min when nobody is looking", () => {
    expect(nextRefreshDelayMs(now, null, 0)).toBe(IDLE_INTERVAL_MS);
    expect(nextRefreshDelayMs(now, now - ACTIVE_WINDOW_MS, 0)).toBe(
      IDLE_INTERVAL_MS,
    );
  });

  it("backs off after failures regardless of visitors", () => {
    expect(nextRefreshDelayMs(now, now, 1)).toBe(15_000);
    expect(nextRefreshDelayMs(now, now, 3)).toBe(60_000);
    expect(nextRefreshDelayMs(now, null, 20)).toBe(300_000);
  });

  it("lets a request refresh once the data is 45 s old", () => {
    expect(cooldownMs(0)).toBe(ACTIVE_INTERVAL_MS);
  });

  it("cuts idle refreshes by more than 90 %", () => {
    const perDay = (interval: number) => 86_400_000 / interval;
    expect(perDay(ACTIVE_INTERVAL_MS)).toBe(1_920);
    expect(perDay(IDLE_INTERVAL_MS)).toBe(144);
  });
});

describe("alarm writes", () => {
  it("writes when there is no alarm", () => {
    expect(alarmToWrite(null, now)).toBe(now);
  });
  it("pulls a far idle alarm in when a visitor arrives", () => {
    expect(alarmToWrite(now + IDLE_INTERVAL_MS, now + 45_000)).toBe(
      now + 45_000,
    );
  });
  it("never rewrites an alarm that is already due as soon or sooner", () => {
    expect(alarmToWrite(now + 30_000, now + 45_000)).toBeNull();
    expect(alarmToWrite(now + 45_000, now + 45_000)).toBeNull();
  });
});
