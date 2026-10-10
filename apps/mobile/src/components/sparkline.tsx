/**
 * Sparkline — a row-sized trend line drawn from real observations only.
 *
 * The earlier UI had a decorative sparkline with invented data and it was
 * rightly removed. This one draws the server's stored observations, and draws
 * nothing at all when there are fewer than two of them, so the space never
 * implies a trend that was not measured. Its box is reserved either way so the
 * row does not shift when the data arrives.
 */
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useTheme } from "./theme";

/** Line and area paths for `values`, padded so a flat series sits mid-box. */
export function sparklinePaths(
  values: number[],
  width: number,
  height: number,
  inset = 2,
) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.15, Math.abs(max) * 0.002, 1e-9);
  const lo = min - pad;
  const span = max + pad - lo;
  const usableW = width - inset * 2;
  const usableH = height - inset * 2;
  const pts = values.map((v, i) => [
    inset + (i / (values.length - 1)) * usableW,
    inset + usableH - ((v - lo) / span) * usableH,
  ]);
  const f = (n: number) => Math.round(n * 100) / 100;
  const line = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`)
    .join(" ");
  const area = `${line} L${f(pts[pts.length - 1][0])} ${height} L${f(pts[0][0])} ${height} Z`;
  const first = values[0];
  const last = values[values.length - 1];
  const trend: "up" | "down" | "flat" =
    last > first ? "up" : last < first ? "down" : "flat";
  return { line, area, trend };
}

export function Sparkline({
  values,
  width = 58,
  height = 28,
  color,
}: {
  values: number[] | null;
  width?: number;
  height?: number;
  /** Override for surfaces with their own palette (the brand hero). */
  color?: string;
}) {
  const t = useTheme();
  const paths = values ? sparklinePaths(values, width, height) : null;
  if (!paths) return <View style={{ width, height }} />;

  const stroke =
    color ??
    (paths.trend === "up"
      ? t.green
      : paths.trend === "down"
        ? t.red
        : t.textTertiary);
  const id = `spark-${paths.trend}-${width}`;

  return (
    <View
      style={{ width, height }}
      accessible
      accessibilityLabel={
        paths.trend === "up"
          ? "روند افزایشی"
          : paths.trend === "down"
            ? "روند کاهشی"
            : "بدون تغییر"
      }
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity={0.28} />
            <Stop offset="1" stopColor={stroke} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {/* A flat series gets no area: filled, it reads as a solid slab. */}
        {paths.trend === "flat" ? null : (
          <Path d={paths.area} fill={`url(#${id})`} />
        )}
        <Path
          d={paths.line}
          stroke={stroke}
          strokeWidth={paths.trend === "flat" ? 1.25 : 1.75}
          strokeOpacity={paths.trend === "flat" ? 0.55 : 1}
          strokeDasharray={paths.trend === "flat" ? "3 4" : undefined}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
