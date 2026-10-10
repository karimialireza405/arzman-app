import { describe, expect, it, vi } from "vitest";

// The component module imports react-native; only the pure path builder is
// under test, so stub the renderer-facing imports.
vi.mock("react-native", () => ({ View: () => null }));
vi.mock("react-native-svg", () => ({
  default: () => null,
  Defs: () => null,
  LinearGradient: () => null,
  Path: () => null,
  Stop: () => null,
}));
vi.mock("./theme", () => ({ useTheme: () => ({}) }));

const { sparklinePaths } = await import("./sparkline");

describe("sparkline paths", () => {
  it("draws nothing for fewer than two real observations", () => {
    expect(sparklinePaths([], 58, 28)).toBeNull();
    expect(sparklinePaths([230_800], 58, 28)).toBeNull();
  });

  it("reports the trend from first to last observation", () => {
    expect(sparklinePaths([1, 2, 3], 58, 28)!.trend).toBe("up");
    expect(sparklinePaths([3, 2, 1], 58, 28)!.trend).toBe("down");
    expect(sparklinePaths([2, 2, 2], 58, 28)!.trend).toBe("flat");
  });

  it("centres a flat series instead of drawing it on an edge", () => {
    const { line } = sparklinePaths([230_800, 230_800], 58, 28)!;
    const ys = [...line.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((m) =>
      Number(m[1]),
    );
    for (const y of ys) expect(Math.abs(y - 14)).toBeLessThan(0.5);
  });

  it("keeps every point inside the box", () => {
    const { line } = sparklinePaths([5, 9, 1, 7, 3], 58, 28)!;
    for (const m of line.matchAll(/[ML]([\d.]+) ([\d.]+)/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(0);
      expect(Number(m[1])).toBeLessThanOrEqual(58);
      expect(Number(m[2])).toBeGreaterThanOrEqual(0);
      expect(Number(m[2])).toBeLessThanOrEqual(28);
    }
  });
});
